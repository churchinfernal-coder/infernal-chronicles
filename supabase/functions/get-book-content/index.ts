import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ error: "Invalid user token" }, 401);

    const { bookId } = await req.json();
    if (!bookId) return json({ error: "Missing bookId" }, 400);

    const { data: book, error: bookError } = await supabase
      .from("occult_library_books")
      .select("id, title, author, description, book_project_id, total_chapters, total_words")
      .eq("id", bookId)
      .single();

    if (bookError || !book) return json({ error: "Book not found" }, 404);

    const [{ data: sub }, { data: purchase }, { data: isAdmin }] = await Promise.all([
      supabase
        .from("occult_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("book_purchases")
        .select("book_id")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle(),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
    ]);

    const hasAccess = Boolean(sub) || Boolean(purchase) || isAdmin === true;
    if (!hasAccess) {
      return json({ error: "Subscribe or purchase to read this book" }, 403);
    }

    const { data: chapters, error: chapterError } = await supabase
      .from("book_chapters")
      .select("id, chapter_number, title, content, word_count")
      .eq("project_id", book.book_project_id)
      .order("chapter_number");

    if (chapterError) {
      return json({ error: "Failed to load chapters" }, 500);
    }

    const { data: history } = await supabase
      .from("reading_history")
      .select("chapter_number, progress_percentage")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    return json(
      {
        book,
        chapters: chapters || [],
        tableOfContents: (chapters || []).map((ch: any) => ({
          chapterNumber: ch.chapter_number,
          title: ch.title,
        })),
        readingHistory: history || null,
      },
      200
    );
  } catch (error: any) {
    console.error("get-book-content error:", error);
    return json({ error: error.message ?? "Unexpected error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

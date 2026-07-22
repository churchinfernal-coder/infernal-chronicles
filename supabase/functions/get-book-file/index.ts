import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Short-lived signed URL so a link cannot be shared/re-used for long.
const SIGNED_URL_TTL_SECONDS = 300;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // 1. Authenticate the caller.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return json({ error: "Invalid user token" }, 401);
    }

    // 2. Validate input. `download: true` returns a URL that forces a file
    //    download (Content-Disposition: attachment) instead of inline viewing.
    const { bookId, download } = await req.json();
    if (!bookId) {
      return json({ error: "Missing bookId" }, 400);
    }

    // 3. Look up the book and its stored PDF path.
    const { data: book, error: bookError } = await supabase
      .from("occult_library_books")
      .select("id, title, pdf_url")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      return json({ error: "Book not found" }, 404);
    }
    if (!book.pdf_url) {
      return json({ error: "PDF not available for this book" }, 404);
    }

    // 4. Enforce the entitlement rule server-side:
    //    active subscription OR an individual purchase OR admin.
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

    // 5. Issue a short-lived signed URL to the private object.
    const safeName = `${(book.title || "book").replace(/[^\w.-]+/g, "_")}.pdf`;
    const { data: signed, error: signError } = await supabase.storage
      .from("book-pdfs")
      .createSignedUrl(
        book.pdf_url,
        SIGNED_URL_TTL_SECONDS,
        download ? { download: safeName } : undefined
      );

    if (signError || !signed?.signedUrl) {
      return json({ error: "Could not generate access link" }, 500);
    }

    return json({ url: signed.signedUrl, title: book.title, expiresIn: SIGNED_URL_TTL_SECONDS }, 200);
  } catch (error: any) {
    console.error("get-book-file error:", error);
    return json({ error: error.message ?? "Unexpected error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

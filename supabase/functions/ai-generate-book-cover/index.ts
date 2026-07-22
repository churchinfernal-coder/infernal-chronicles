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
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return json({ error: "OPENAI_API_KEY not configured" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ error: "Invalid user token" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (isAdmin !== true) {
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    const { bookId, title, author, description, genre, setting } = await req.json();
    if (!title || !description) {
      return json({ error: "title and description are required" }, 400);
    }

    const coverPrompt = [
      "Create a premium, cinematic book cover illustration.",
      `Title: ${title}`,
      `Author: ${author || "Infernal Chronicles"}`,
      `Genre: ${genre || "occult"}`,
      `Story description: ${description}`,
      `Setting: ${setting || "mystical infernal realm"}`,
      "Design requirements: no readable text, no watermark, dramatic composition, high contrast, polished professional publishing style, dark occult fantasy mood.",
      "Output image only."
    ].join("\n");

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: coverPrompt,
        size: "1024x1536",
      }),
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      return json({ error: `Image generation failed: ${errText}` }, 500);
    }

    const imageData = await imageResponse.json();
    const b64 = imageData?.data?.[0]?.b64_json;
    if (!b64) {
      return json({ error: "No image data returned by model" }, 500);
    }

    const bytes = base64ToUint8Array(b64);
    const objectPath = `ai-covers/${bookId || crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("book-covers")
      .upload(objectPath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      return json({ error: `Storage upload failed: ${uploadError.message}` }, 500);
    }

    const { data: pub } = supabase.storage.from("book-covers").getPublicUrl(objectPath);
    const coverUrl = pub.publicUrl;

    if (bookId) {
      const { error: updateError } = await supabase
        .from("occult_library_books")
        .update({ cover_image_url: coverUrl })
        .eq("id", bookId);
      if (updateError) {
        return json({ error: `Book update failed: ${updateError.message}` }, 500);
      }
    }

    return json({ coverUrl, promptUsed: coverPrompt }, 200);
  } catch (error: any) {
    console.error("ai-generate-book-cover error:", error);
    return json({ error: error.message ?? "Unexpected error" }, 500);
  }
});

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

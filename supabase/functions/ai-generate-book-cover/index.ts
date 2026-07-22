import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_PROJECT_SCOPE = "00000000-0000-0000-0000-000000000000";

type SemanticImageMemoryRow = {
  symbol: string;
  style: string;
  cover_prompt: string;
  similarity: number;
};

type CriticResult = {
  score: number;
  missingSymbols: string[];
  notes: string;
  revisedPrompt: string;
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

function toUuidOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRe.test(trimmed) ? trimmed : null;
}

function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(value.trim());
  }
  return out;
}

function extractVisualSymbols(input: string): string[] {
  const source = input.toLowerCase();
  const dictionary: Array<{ token: string; symbol: string }> = [
    { token: "rune", symbol: "Runes" },
    { token: "tarot", symbol: "Tarot Card" },
    { token: "sigil", symbol: "Sigil Circle" },
    { token: "necrom", symbol: "Necromantic Altar" },
    { token: "moon", symbol: "Blood Moon" },
    { token: "goetia", symbol: "Goetic Seal" },
    { token: "demon", symbol: "Infernal Entity" },
    { token: "altar", symbol: "Ritual Altar" },
    { token: "shadow", symbol: "Shadow Cloak" },
    { token: "skull", symbol: "Skull Relic" },
    { token: "serpent", symbol: "Serpent Coil" },
    { token: "candle", symbol: "Black Candles" },
    { token: "pentagram", symbol: "Pentagram" },
    { token: "occult", symbol: "Occult Glyphs" },
    { token: "spell", symbol: "Spell Script" },
  ];

  const symbols: string[] = [];
  for (const item of dictionary) {
    if (source.includes(item.token)) {
      symbols.push(item.symbol);
    }
  }

  if (symbols.length === 0) {
    symbols.push("Occult Sigils", "Cinematic Shadows");
  }

  return uniq(symbols).slice(0, 8);
}

function deriveStyle(genre: unknown, styleInput: unknown): string {
  const explicitStyle = typeof styleInput === "string" ? styleInput.trim().toLowerCase() : "";
  if (explicitStyle) return explicitStyle;

  const genreText = typeof genre === "string" ? genre.toLowerCase() : "";
  if (genreText.includes("horror") || genreText.includes("necrom")) return "gothic";
  if (genreText.includes("epic") || genreText.includes("fantasy")) return "cinematic";
  if (genreText.includes("mystic") || genreText.includes("dream")) return "surreal";
  return "gothic";
}

async function getEmbeddingVector(openAIApiKey: string, text: string): Promise<number[] | null> {
  const input = text.trim();
  if (!input) return null;

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const embedding = data?.data?.[0]?.embedding;
  return Array.isArray(embedding) ? embedding : null;
}

async function queryImageMemory(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[] | null,
  projectScopeId: string
): Promise<SemanticImageMemoryRow[]> {
  if (!queryEmbedding) return [];

  const { data, error } = await supabase.rpc("match_image_memory_semantic", {
    query_embedding: queryEmbedding,
    match_count: 8,
    project_filter: projectScopeId,
  });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .filter((row: any) => typeof row?.symbol === "string")
    .map((row: any) => ({
      symbol: row.symbol,
      style: typeof row.style === "string" ? row.style : "gothic",
      cover_prompt: typeof row.cover_prompt === "string" ? row.cover_prompt : "",
      similarity: Number(row.similarity || 0),
    }));
}

async function queryEngineThemes(
  supabase: ReturnType<typeof createClient>,
  projectScopeId: string
): Promise<string[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("engine_memory")
      .select("memory_key, memory_value")
      .eq("source_project_id", projectScopeId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const extracted: string[] = [];
    for (const row of data) {
      if (typeof row?.memory_key === "string") {
        extracted.push(row.memory_key);
      }
      if (typeof row?.memory_value === "string") {
        extracted.push(...extractVisualSymbols(row.memory_value));
      }
    }
    return uniq(extracted).slice(0, 8);
  } catch {
    return [];
  }
}

function buildCoverPrompt(input: {
  title: string;
  author: string;
  description: string;
  genre: string;
  setting: string;
  style: string;
  symbols: string[];
  recalledStyles: string[];
  engineThemes: string[];
}): string {
  const recalledStyleLine = input.recalledStyles.length
    ? `Reference continuity styles: ${input.recalledStyles.join(", ")}.`
    : "Reference continuity styles: gothic, cinematic.";

  const engineThemeLine = input.engineThemes.length
    ? `Cross-modal themes from writing memory: ${input.engineThemes.join(", ")}.`
    : "Cross-modal themes from writing memory: preserve occult thematic continuity.";

  return [
    "Create a premium, cinematic book cover illustration.",
    `Title: ${input.title}`,
    `Author: ${input.author}`,
    `Genre: ${input.genre}`,
    `Story description: ${input.description}`,
    `Setting: ${input.setting}`,
    `Visual style direction: ${input.style}.`,
    `Core visual symbols to include: ${input.symbols.join(", ")}.`,
    recalledStyleLine,
    engineThemeLine,
    "Design requirements: no readable text, no watermark, dramatic composition, high contrast, polished professional publishing style, dark occult fantasy mood.",
    "Output image only.",
  ].join("\n");
}

function runCriticPass(prompt: string, requiredSymbols: string[]): CriticResult {
  const normalizedPrompt = prompt.toLowerCase();
  const missing = requiredSymbols.filter((symbol) => !normalizedPrompt.includes(symbol.toLowerCase()));
  const score = Math.max(0, 100 - missing.length * 15);

  if (missing.length === 0) {
    return {
      score,
      missingSymbols: [],
      notes: "Prompt covers required motifs.",
      revisedPrompt: prompt,
    };
  }

  const revisedPrompt = `${prompt}\n\nCritic correction: ensure these motifs are explicitly visible: ${missing.join(", ")}.`;
  return {
    score,
    missingSymbols: missing,
    notes: `Missing motifs detected: ${missing.join(", ")}`,
    revisedPrompt,
  };
}

async function generateImage(openAIApiKey: string, prompt: string) {
  const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
    }),
  });

  if (!imageResponse.ok) {
    const errText = await imageResponse.text();
    throw new Error(`Image generation failed: ${errText}`);
  }

  const imageData = await imageResponse.json();
  const b64 = imageData?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("No image data returned by model");
  }

  return b64;
}

async function persistImageMemory(input: {
  supabase: ReturnType<typeof createClient>;
  openAIApiKey: string;
  projectScopeId: string;
  bookId: string | null;
  style: string;
  symbols: string[];
  coverPrompt: string;
  critic: CriticResult;
}) {
  for (const symbol of input.symbols) {
    const embedding = await getEmbeddingVector(input.openAIApiKey, `${symbol} ${input.style}`);
    await (input.supabase as any)
      .from("image_memory")
      .upsert(
        {
          symbol,
          style: input.style,
          source_project_id: input.projectScopeId,
          book_id: input.bookId,
          cover_prompt: input.coverPrompt,
          embedding,
          critic_score: input.critic.score,
          critic_notes: input.critic.notes,
          source_function: "ai-generate-book-cover",
        },
        { onConflict: "symbol,style,source_project_id" }
      );
  }
}

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

    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) return json({ error: "Missing authorization header" }, 401);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ error: "Invalid user token" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (isAdmin !== true) {
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    const {
      bookId,
      title,
      author,
      description,
      genre,
      setting,
      style,
      sourceProjectId,
      projectId,
      dryRun,
      strictCritic,
    } = await req.json();

    if (!title || !description) {
      return json({ error: "title and description are required" }, 400);
    }

    const bookIdValue = toUuidOrNull(bookId);
    const requestedProjectId = toUuidOrNull(sourceProjectId) || toUuidOrNull(projectId);
    const projectScopeId = requestedProjectId || bookIdValue || FALLBACK_PROJECT_SCOPE;
    const visualStyle = deriveStyle(genre, style);

    const semanticSeed = `${title}\n${description}\n${genre || "occult"}\n${setting || "mystical infernal realm"}\n${visualStyle}`;
    const queryEmbedding = await getEmbeddingVector(openAIApiKey, semanticSeed);
    const semanticRows = await queryImageMemory(supabase, queryEmbedding, projectScopeId);
    const recalledSymbols = uniq(semanticRows.map((row) => row.symbol)).slice(0, 8);
    const recalledStyles = uniq(semanticRows.map((row) => row.style)).slice(0, 4);
    const engineThemes = await queryEngineThemes(supabase, projectScopeId);
    const extractedSymbols = extractVisualSymbols(`${title}\n${description}\n${genre || ""}\n${setting || ""}`);
    const requiredSymbols = uniq([...extractedSymbols, ...recalledSymbols, ...engineThemes]).slice(0, 10);

    const coverPrompt = buildCoverPrompt({
      title,
      author: author || "Infernal Chronicles",
      description,
      genre: genre || "occult",
      setting: setting || "mystical infernal realm",
      style: visualStyle,
      symbols: requiredSymbols,
      recalledStyles,
      engineThemes,
    });

    const critic = runCriticPass(coverPrompt, requiredSymbols.slice(0, 6));
    const finalPrompt = strictCritic === true ? critic.revisedPrompt : coverPrompt;

    if (dryRun === true) {
      return json(
        {
          dryRun: true,
          promptUsed: finalPrompt,
          critic,
          recalledSymbols,
          recalledStyles,
          crossModalThemes: engineThemes,
          readSource: semanticRows.length > 0 ? "image_memory.semantic" : "fallback",
          projectScopeId,
        },
        200
      );
    }

    const b64 = await generateImage(openAIApiKey, finalPrompt);

    const bytes = base64ToUint8Array(b64);
    const objectPath = `ai-covers/${bookIdValue || crypto.randomUUID()}.png`;

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

    if (bookIdValue) {
      const { error: updateError } = await supabase
        .from("occult_library_books")
        .update({ cover_image_url: coverUrl })
        .eq("id", bookIdValue);
      if (updateError) {
        return json({ error: `Book update failed: ${updateError.message}` }, 500);
      }
    }

    await persistImageMemory({
      supabase,
      openAIApiKey,
      projectScopeId,
      bookId: bookIdValue,
      style: visualStyle,
      symbols: requiredSymbols,
      coverPrompt: finalPrompt,
      critic,
    });

    return json(
      {
        coverUrl,
        promptUsed: finalPrompt,
        critic,
        recalledSymbols,
        recalledStyles,
        crossModalThemes: engineThemes,
        readSource: semanticRows.length > 0 ? "image_memory.semantic" : "fallback",
        projectScopeId,
      },
      200
    );
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

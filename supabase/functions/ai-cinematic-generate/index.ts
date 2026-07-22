import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_PROJECT_SCOPE = "00000000-0000-0000-0000-000000000000";

type SemanticVideoMemoryRow = {
  symbol: string;
  style: string;
  narrative_theme: string;
  video_prompt: string;
  similarity: number;
};

type CriticResult = {
  score: number;
  missingMotifs: string[];
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

function extractVideoSymbols(input: string): string[] {
  const source = input.toLowerCase();
  const dictionary: Array<{ token: string; symbol: string }> = [
    { token: "rune", symbol: "Runes" },
    { token: "tarot", symbol: "Tarot Card" },
    { token: "labyrinth", symbol: "Labyrinth" },
    { token: "pentagram", symbol: "Pentagram" },
    { token: "sigil", symbol: "Sigil" },
    { token: "moon", symbol: "Blood Moon" },
    { token: "skull", symbol: "Skull Relic" },
    { token: "mirror", symbol: "Mirror Gate" },
    { token: "serpent", symbol: "Serpent Coil" },
    { token: "altar", symbol: "Ritual Altar" },
    { token: "candle", symbol: "Black Candle" },
    { token: "door", symbol: "Threshold Door" },
    { token: "veil", symbol: "Veil" },
    { token: "eclipse", symbol: "Eclipse" },
    { token: "choir", symbol: "Infernal Choir" },
  ];

  const symbols: string[] = [];
  for (const item of dictionary) {
    if (source.includes(item.token)) {
      symbols.push(item.symbol);
    }
  }

  if (symbols.length === 0) {
    symbols.push("Occult Motifs", "Cinematic Motion");
  }

  return uniq(symbols).slice(0, 8);
}

function extractNarrativeThemes(input: string): string[] {
  const source = input.toLowerCase();
  const dictionary: Array<{ token: string; theme: string }> = [
    { token: "ritual", theme: "ritual" },
    { token: "transformation", theme: "transformation" },
    { token: "duality", theme: "duality" },
    { token: "possession", theme: "possession" },
    { token: "prophecy", theme: "prophecy" },
    { token: "death", theme: "death ritual" },
    { token: "necrom", theme: "necromancy" },
    { token: "threshold", theme: "threshold crossing" },
    { token: "revelation", theme: "revelation" },
    { token: "corruption", theme: "corruption" },
    { token: "ascension", theme: "ascension" },
    { token: "descent", theme: "descent" },
  ];

  const themes: string[] = [];
  for (const item of dictionary) {
    if (source.includes(item.token)) {
      themes.push(item.theme);
    }
  }

  if (themes.length === 0) {
    themes.push("ritual", "transformation");
  }

  return uniq(themes).slice(0, 6);
}

function deriveStyle(genre: unknown, styleInput: unknown, lighting: unknown): string {
  const explicitStyle = typeof styleInput === "string" ? styleInput.trim().toLowerCase() : "";
  if (explicitStyle) return explicitStyle;

  const genreText = typeof genre === "string" ? genre.toLowerCase() : "";
  const lightingText = typeof lighting === "string" ? lighting.toLowerCase() : "";
  if (genreText.includes("documentary") || lightingText.includes("natural")) return "documentary";
  if (genreText.includes("surreal") || genreText.includes("dream")) return "surreal";
  if (genreText.includes("gothic") || genreText.includes("occult") || lightingText.includes("dramatic")) return "gothic";
  return "cinematic";
}

function deriveVideoFormat(type: unknown, aspectRatio: unknown): string {
  if (typeof type === "string" && type.toLowerCase() === "video") return "mp4";
  const ratio = typeof aspectRatio === "string" ? aspectRatio : "1:1";
  if (ratio === "9:16") return "png-sequence-portrait";
  if (ratio === "16:9") return "png-sequence-landscape";
  return "png-sequence-square";
}

function deriveDurationSeconds(frameCount: unknown): number {
  const count = typeof frameCount === "number" && Number.isFinite(frameCount) ? frameCount : 12;
  return Number((Math.max(count, 1) / 10).toFixed(2));
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

async function queryVideoMemory(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[] | null,
  projectScopeId: string
): Promise<SemanticVideoMemoryRow[]> {
  if (!queryEmbedding) return [];

  const { data, error } = await supabase.rpc("match_video_memory_semantic", {
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
      style: typeof row.style === "string" ? row.style : "cinematic",
      narrative_theme: typeof row.narrative_theme === "string" ? row.narrative_theme : "ritual",
      video_prompt: typeof row.video_prompt === "string" ? row.video_prompt : "",
      similarity: Number(row.similarity || 0),
    }));
}

async function queryImageMemory(
  supabase: ReturnType<typeof createClient>,
  queryEmbedding: number[] | null,
  projectScopeId: string
): Promise<string[]> {
  if (!queryEmbedding) return [];

  const { data, error } = await supabase.rpc("match_image_memory_semantic", {
    query_embedding: queryEmbedding,
    match_count: 8,
    project_filter: projectScopeId,
  });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return uniq(
    data
      .filter((row: any) => typeof row?.symbol === "string")
      .map((row: any) => row.symbol)
  ).slice(0, 8);
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
        extracted.push(...extractNarrativeThemes(row.memory_value));
        extracted.push(...extractVideoSymbols(row.memory_value));
      }
    }
    return uniq(extracted).slice(0, 8);
  } catch {
    return [];
  }
}

function buildVideoPrompt(input: {
  prompt: string;
  style: string;
  background: string;
  lighting: string;
  aspectRatio: string;
  frameCount: number;
  durationSeconds: number;
  videoFormat: string;
  symbols: string[];
  themes: string[];
  recalledStyles: string[];
  engineThemes: string[];
  imageSymbols: string[];
}): string {
  const recalledStyleLine = input.recalledStyles.length
    ? `Reference continuity styles: ${input.recalledStyles.join(", ")}.`
    : "Reference continuity styles: cinematic, gothic.";

  const engineThemeLine = input.engineThemes.length
    ? `Cross-modal themes from text memory: ${input.engineThemes.join(", ")}.`
    : "Cross-modal themes from text memory: preserve occult thematic continuity.";

  const imageLine = input.imageSymbols.length
    ? `Cross-modal visual symbols from image memory: ${input.imageSymbols.join(", ")}.`
    : "Cross-modal visual symbols from image memory: mirror the dominant occult motifs.";

  return [
    "Create a premium cinematic video sequence with frame-by-frame continuity.",
    `User prompt: ${input.prompt}`,
    `Visual style direction: ${input.style}.`,
    `Background: ${input.background}.`,
    `Lighting: ${input.lighting}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
    `Target frame count: ${input.frameCount}.`,
    `Target duration: ${input.durationSeconds.toFixed(2)} seconds.`,
    `Target format: ${input.videoFormat}.`,
    `Core visual symbols to include: ${input.symbols.join(", ")}.`,
    `Narrative themes to reinforce: ${input.themes.join(", ")}.`,
    recalledStyleLine,
    engineThemeLine,
    imageLine,
    "Design requirements: maintain recurring motifs across frames, no readable text, no watermark, no compression artifacts, cinematic motion, temporal continuity, strong atmospheric lighting.",
    "Output should be suitable for a frame sequence or video render pipeline.",
  ].join("\n");
}

function runCriticPass(prompt: string, requiredTokens: string[]): CriticResult {
  const normalizedPrompt = prompt.toLowerCase();
  const missing = requiredTokens.filter((token) => !normalizedPrompt.includes(token.toLowerCase()));
  const score = Math.max(0, 100 - missing.length * 12);

  if (missing.length === 0) {
    return {
      score,
      missingMotifs: [],
      notes: "Prompt covers required motifs.",
      revisedPrompt: prompt,
    };
  }

  const revisedPrompt = `${prompt}\n\nCritic correction: ensure these motifs are explicitly visible: ${missing.join(", ")}.`;
  return {
    score,
    missingMotifs: missing,
    notes: `Missing motifs detected: ${missing.join(", ")}`,
    revisedPrompt,
  };
}

async function generateImage(openAIApiKey: string, prompt: string, size: string) {
  const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
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

function sizeForAspectRatio(aspectRatio: string): string {
  if (aspectRatio === "16:9") return "1536x1024";
  if (aspectRatio === "9:16") return "1024x1536";
  return "1024x1024";
}

async function generateFrameSequence(openAIApiKey: string, prompt: string, frameCount: number, aspectRatio: string) {
  const size = sizeForAspectRatio(aspectRatio);
  const frames: string[] = [];

  for (let index = 0; index < frameCount; index++) {
    const framePrompt = [
      prompt,
      `Frame ${index + 1} of ${frameCount}.`,
      "Maintain recurring motifs, subtle motion, and temporal continuity.",
    ].join("\n");
    const b64 = await generateImage(openAIApiKey, framePrompt, size);
    frames.push(`data:image/png;base64,${b64}`);
  }

  return frames;
}

async function persistVideoMemory(input: {
  supabase: ReturnType<typeof createClient>;
  openAIApiKey: string;
  projectScopeId: string;
  style: string;
  symbols: string[];
  themes: string[];
  videoPrompt: string;
  durationSeconds: number;
  videoFormat: string;
  critic: CriticResult;
}) {
  const primaryTheme = input.themes[0] || "ritual";

  for (const symbol of input.symbols) {
    const embedding = await getEmbeddingVector(
      input.openAIApiKey,
      `${symbol} ${input.style} ${primaryTheme} ${input.videoPrompt}`
    );

    await (input.supabase as any)
      .from("video_memory")
      .upsert(
        {
          symbol,
          style: input.style,
          narrative_theme: primaryTheme,
          source_project_id: input.projectScopeId,
          video_prompt: input.videoPrompt,
          duration_seconds: input.durationSeconds,
          video_format: input.videoFormat,
          narrative_beats: input.themes,
          embedding,
          critic_score: input.critic.score,
          critic_notes: input.critic.notes,
          source_function: "ai-cinematic-generate",
        },
        { onConflict: "symbol,style,narrative_theme,source_project_id" }
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
      prompt,
      type,
      style,
      background,
      lighting,
      pose,
      expression,
      frameCount,
      aspectRatio,
      sourceProjectId,
      projectId,
      dryRun,
      strictCritic,
    } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return json({ error: "prompt is required" }, 400);
    }

    const requestedProjectId = toUuidOrNull(sourceProjectId) || toUuidOrNull(projectId);
    const projectScopeId = requestedProjectId || FALLBACK_PROJECT_SCOPE;
    const resolvedType = typeof type === "string" ? type : "animation";
    const resolvedFrameCount = Math.max(1, Number(frameCount || 12));
    const resolvedAspectRatio = typeof aspectRatio === "string" ? aspectRatio : "1:1";
    const visualStyle = deriveStyle(undefined, style, lighting);
    const videoFormat = deriveVideoFormat(resolvedType, resolvedAspectRatio);
    const durationSeconds = deriveDurationSeconds(resolvedFrameCount);

    const semanticSeed = `${prompt}\n${visualStyle}\n${background || ""}\n${lighting || ""}\n${pose || ""}\n${expression || ""}`;
    const queryEmbedding = await getEmbeddingVector(openAIApiKey, semanticSeed);
    const videoRows = await queryVideoMemory(supabase, queryEmbedding, projectScopeId);
    const imageSymbols = await queryImageMemory(supabase, queryEmbedding, projectScopeId);
    const engineThemes = await queryEngineThemes(supabase, projectScopeId);

    const recalledSymbols = uniq(videoRows.map((row) => row.symbol)).slice(0, 8);
    const recalledStyles = uniq(videoRows.map((row) => row.style)).slice(0, 4);
    const recalledThemes = uniq(videoRows.map((row) => row.narrative_theme)).slice(0, 4);
    const extractedSymbols = extractVideoSymbols(prompt);
    const extractedThemes = extractNarrativeThemes(prompt);
    const requiredSymbols = uniq([...extractedSymbols, ...recalledSymbols, ...imageSymbols]).slice(0, 10);
    const requiredThemes = uniq([...extractedThemes, ...recalledThemes, ...engineThemes]).slice(0, 8);

    const videoPrompt = buildVideoPrompt({
      prompt,
      style: visualStyle,
      background: typeof background === "string" ? background : "ritual chamber",
      lighting: typeof lighting === "string" ? lighting : "dramatic",
      aspectRatio: resolvedAspectRatio,
      frameCount: resolvedFrameCount,
      durationSeconds,
      videoFormat,
      symbols: requiredSymbols,
      themes: requiredThemes,
      recalledStyles,
      engineThemes,
      imageSymbols,
    });

    const critic = runCriticPass(videoPrompt, [...requiredSymbols.slice(0, 5), ...requiredThemes.slice(0, 3)]);
    const finalPrompt = strictCritic === true ? critic.revisedPrompt : videoPrompt;

    if (dryRun === true) {
      return json(
        {
          dryRun: true,
          promptUsed: finalPrompt,
          critic,
          recalledSymbols,
          recalledStyles,
          recalledThemes,
          crossModalThemes: engineThemes,
          crossModalImageSymbols: imageSymbols,
          videoFormat,
          durationSeconds,
          projectScopeId,
          readSource: videoRows.length > 0 ? "video_memory.semantic" : "fallback",
        },
        200
      );
    }

    const resultType = resolvedType === "image" ? "image" : "animation";
    if (resultType === "image") {
      const b64 = await generateImage(openAIApiKey, finalPrompt, sizeForAspectRatio(resolvedAspectRatio));
      await persistVideoMemory({
        supabase,
        openAIApiKey,
        projectScopeId,
        style: visualStyle,
        symbols: requiredSymbols,
        themes: requiredThemes,
        videoPrompt: finalPrompt,
        durationSeconds,
        videoFormat,
        critic,
      });

      return json(
        {
          type: "image",
          imageUrl: `data:image/png;base64,${b64}`,
          promptUsed: finalPrompt,
          critic,
          recalledSymbols,
          recalledStyles,
          recalledThemes,
          crossModalThemes: engineThemes,
          crossModalImageSymbols: imageSymbols,
          videoFormat,
          durationSeconds,
          projectScopeId,
        },
        200
      );
    }

    const frames = await generateFrameSequence(openAIApiKey, finalPrompt, resolvedFrameCount, resolvedAspectRatio);

    await persistVideoMemory({
      supabase,
      openAIApiKey,
      projectScopeId,
      style: visualStyle,
      symbols: requiredSymbols,
      themes: requiredThemes,
      videoPrompt: finalPrompt,
      durationSeconds,
      videoFormat,
      critic,
    });

    return json(
      {
        type: "animation",
        frames,
        promptUsed: finalPrompt,
        critic,
        recalledSymbols,
        recalledStyles,
        recalledThemes,
        crossModalThemes: engineThemes,
        crossModalImageSymbols: imageSymbols,
        videoFormat,
        durationSeconds,
        projectScopeId,
      },
      200
    );
  } catch (error: any) {
    console.error("ai-cinematic-generate error:", error);
    return json({ error: error.message ?? "Unexpected error" }, 500);
  }
});
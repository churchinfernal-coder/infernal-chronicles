import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { jwtVerify } from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Short-lived signed URL so a link cannot be shared/re-used for long.
const SIGNED_URL_TTL_SECONDS = 300;
const supabaseJwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || "";
const AUTH_CACHE_TTL_MS = 30_000;
const BOOK_CACHE_TTL_MS = 60_000;
const ENTITLEMENT_CACHE_TTL_MS = 20_000;
const SIGNED_URL_CACHE_TTL_MS = 240_000;
const CACHE_MAX = 2000;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const authCache = new Map<string, { id: string; expiresAt: number }>();
const bookCache = new Map<string, { title: string; storagePath: string; expiresAt: number }>();
const entitlementCache = new Map<string, { hasAccess: boolean; expiresAt: number }>();
const signedUrlCache = new Map<string, { url: string; title: string; expiresIn: number; expiresAt: number }>();
const signingInFlight = new Map<string, Promise<{ url: string; title: string; expiresIn: number }>>();

function normalizeStoragePath(value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  // Handle full public/signed URLs by extracting the object path after /book-pdfs/.
  const marker = "/book-pdfs/";
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex >= 0) {
    const rawPath = trimmed.slice(markerIndex + marker.length);
    const withoutQuery = rawPath.split("?")[0];
    return decodeURIComponent(withoutQuery).replace(/^\/+/, "");
  }

  return trimmed.replace(/^\/+/, "");
}

function setLimitedCache<T>(map: Map<string, T>, key: string, value: T) {
  if (map.size >= CACHE_MAX) {
    const oldestKey = map.keys().next().value;
    if (oldestKey) map.delete(oldestKey);
  }
  map.set(key, value);
}

function getFreshCache<T extends { expiresAt: number }>(map: Map<string, T>, key: string): T | null {
  const cached = map.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    map.delete(key);
    return null;
  }
  return cached;
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

async function resolveUserId(token: string): Promise<string | null> {
  const cached = getFreshCache(authCache, token);
  if (cached) {
    return cached.id;
  }

  if (supabaseJwtSecret) {
    try {
      const encoder = new TextEncoder();
      const { payload } = await jwtVerify(token, encoder.encode(supabaseJwtSecret));
      const subject = typeof payload.sub === "string" ? payload.sub : "";
      if (subject) {
        setLimitedCache(authCache, token, { id: subject, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
        return subject;
      }
    } catch {
      // Fallback to authoritative Supabase user lookup.
    }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  setLimitedCache(authCache, token, { id: user.id, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
  return user.id;
}

async function resolveBook(bookId: string): Promise<{ title: string; storagePath: string } | null> {
  const cached = getFreshCache(bookCache, bookId);
  if (cached) {
    return { title: cached.title, storagePath: cached.storagePath };
  }

  const { data: book, error } = await supabase
    .from("occult_library_books")
    .select("id, title, pdf_url")
    .eq("id", bookId)
    .single();

  if (error || !book) {
    return null;
  }

  const storagePath = normalizeStoragePath(book.pdf_url || "");
  if (!storagePath) {
    return null;
  }

  const payload = {
    title: String(book.title || "book"),
    storagePath,
  };

  setLimitedCache(bookCache, bookId, { ...payload, expiresAt: Date.now() + BOOK_CACHE_TTL_MS });
  return payload;
}

async function resolveAccess(userId: string, bookId: string): Promise<boolean> {
  const key = `${userId}:${bookId}`;
  const cached = getFreshCache(entitlementCache, key);
  if (cached) {
    return cached.hasAccess;
  }

  const [{ data: sub }, { data: purchase }] = await Promise.all([
    supabase
      .from("occult_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("book_purchases")
      .select("book_id")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle(),
  ]);

  let hasAccess = Boolean(sub) || Boolean(purchase);

  if (!hasAccess) {
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    hasAccess = isAdmin === true;
  }

  setLimitedCache(entitlementCache, key, {
    hasAccess,
    expiresAt: Date.now() + ENTITLEMENT_CACHE_TTL_MS,
  });

  return hasAccess;
}

async function generateSignedPayload(
  signedKey: string,
  storagePath: string,
  title: string,
  download: boolean
): Promise<{ url: string; title: string; expiresIn: number }> {
  const existing = signingInFlight.get(signedKey);
  if (existing) {
    return existing;
  }

  const work = (async () => {
    const safeName = `${(title || "book").replace(/[^\w.-]+/g, "_")}.pdf`;
    const { data: signed, error: signError } = await supabase.storage
      .from("book-pdfs")
      .createSignedUrl(
        storagePath,
        SIGNED_URL_TTL_SECONDS,
        download ? { download: safeName } : undefined
      );

    if (signError || !signed?.signedUrl) {
      throw new Error("Could not generate access link");
    }

    return {
      url: signed.signedUrl,
      title,
      expiresIn: SIGNED_URL_TTL_SECONDS,
    };
  })();

  signingInFlight.set(signedKey, work);

  try {
    return await work;
  } finally {
    signingInFlight.delete(signedKey);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // 1. Authenticate the caller.
    const token = parseBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const userId = await resolveUserId(token);
    if (!userId) {
      return json({ error: "Access denied" }, 403);
    }

    // 2. Validate input. `download: true` returns a URL that forces a file
    //    download (Content-Disposition: attachment) instead of inline viewing.
    const payload = await req.json().catch(() => ({}));
    const bookId = payload?.bookId || payload?.book_id;
    const download = Boolean(payload?.download);
    if (!bookId) {
      return json({ error: "Missing bookId" }, 400);
    }

    const signedKey = `${userId}:${bookId}:${download ? "dl" : "inline"}`;
    const cachedSigned = getFreshCache(signedUrlCache, signedKey);
    if (cachedSigned) {
      return json(
        { url: cachedSigned.url, title: cachedSigned.title, expiresIn: cachedSigned.expiresIn },
        200
      );
    }

    // 3. Look up the book and its stored PDF path.
    const book = await resolveBook(String(bookId));
    if (!book) {
      return json({ error: "Book not found" }, 404);
    }

    // 4. Enforce the entitlement rule server-side:
    //    active subscription OR an individual purchase OR admin.
    const hasAccess = await resolveAccess(userId, String(bookId));

    if (!hasAccess) {
      return json({ error: "Subscribe or purchase to read this book" }, 403);
    }

    // 5. Issue a short-lived signed URL to the private object.
    const responsePayload = await generateSignedPayload(
      signedKey,
      book.storagePath,
      book.title,
      download
    );

    setLimitedCache(signedUrlCache, signedKey, {
      ...responsePayload,
      expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS,
    });

    return json(responsePayload, 200);
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

import Stripe from "https://esm.sh/stripe@14.9.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { jwtVerify } from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const supabaseJwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const publicUrl = Deno.env.get("PUBLIC_URL") || "https://infernal-chronicles.com";
const perfLogsEnabled = Deno.env.get("PERF_LOGS") === "1";
const AUTH_CACHE_TTL_MS = 30_000;
const AUTH_CACHE_MAX = 2000;
const AUTH_NEGATIVE_CACHE_TTL_MS = 20_000;
const CHECKOUT_CACHE_TTL_MS = 120_000;
const CHECKOUT_CACHE_MAX = 1000;

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const authCache = new Map<string, { id: string; email?: string; expiresAt: number }>();
const authRejectCache = new Map<string, { expiresAt: number }>();
const checkoutCache = new Map<string, { sessionId: string; url: string; expiresAt: number }>();

function json(body: unknown, status = 200, perf?: Record<string, number>) {
  const perfHeaders =
    perf && Object.keys(perf).length > 0
      ? Object.fromEntries(
          Object.entries(perf).map(([k, v]) => [`x-perf-${k}`, String(Math.max(0, Math.round(v)))])
        )
      : {};

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...perfHeaders },
  });
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

function setAuthCache(token: string, user: { id: string; email?: string }) {
  if (authCache.size >= AUTH_CACHE_MAX) {
    const oldestKey = authCache.keys().next().value;
    if (oldestKey) authCache.delete(oldestKey);
  }
  authCache.set(token, { ...user, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
}

function setAuthRejectCache(token: string) {
  if (authRejectCache.size >= AUTH_CACHE_MAX) {
    const oldestKey = authRejectCache.keys().next().value;
    if (oldestKey) authRejectCache.delete(oldestKey);
  }
  authRejectCache.set(token, { expiresAt: Date.now() + AUTH_NEGATIVE_CACHE_TTL_MS });
}

function isRejectedTokenCached(token: string): boolean {
  const cached = authRejectCache.get(token);
  if (!cached) return false;
  if (cached.expiresAt <= Date.now()) {
    authRejectCache.delete(token);
    return false;
  }
  return true;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4;
    const base64 = normalized + (padding ? "=".repeat(4 - padding) : "");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getCachedCheckout(key: string): { sessionId: string; url: string } | null {
  const cached = checkoutCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    checkoutCache.delete(key);
    return null;
  }
  return { sessionId: cached.sessionId, url: cached.url };
}

function setCachedCheckout(key: string, sessionId: string, url: string) {
  if (checkoutCache.size >= CHECKOUT_CACHE_MAX) {
    const oldestKey = checkoutCache.keys().next().value;
    if (oldestKey) checkoutCache.delete(oldestKey);
  }
  checkoutCache.set(key, {
    sessionId,
    url,
    expiresAt: Date.now() + CHECKOUT_CACHE_TTL_MS,
  });
}

async function resolveUserFromToken(token: string): Promise<{ id: string; email?: string } | null> {
  if (isRejectedTokenCached(token)) {
    return null;
  }

  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { id: cached.id, email: cached.email };
  }

  if (cached) {
    authCache.delete(token);
  }

  const unverifiedPayload = decodeJwtPayload(token);
  if (unverifiedPayload?.role === "anon") {
    setAuthRejectCache(token);
    return null;
  }

  if (supabaseJwtSecret) {
    try {
      const encoder = new TextEncoder();
      const { payload } = await jwtVerify(token, encoder.encode(supabaseJwtSecret));
      const subject = typeof payload.sub === "string" ? payload.sub : "";
      if (subject) {
        const localUser = {
          id: subject,
          email: typeof payload.email === "string" ? payload.email : undefined,
        };
        setAuthCache(token, localUser);
        return localUser;
      }
    } catch {
      // Fallback to authoritative Supabase user lookup.
    }
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData?.user) {
    setAuthRejectCache(token);
    return null;
  }

  const user = { id: authData.user.id, email: authData.user.email || undefined };
  setAuthCache(token, user);
  return user;
}

Deno.serve(async (req) => {
  const startedAt = performance.now();
  const perf: Record<string, number> = {};

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    return json({ error: "Server misconfiguration" }, 500);
  }

  try {
    const authStart = performance.now();
    const token = extractBearerToken(req.headers.get("Authorization"));
    perf.auth_parse_ms = performance.now() - authStart;
    if (!token) {
      perf.total_ms = performance.now() - startedAt;
      return json({ error: "Unauthorized" }, 401, perf);
    }

    if (supabaseAnonKey && token === supabaseAnonKey) {
      perf.total_ms = performance.now() - startedAt;
      return json({ error: "Invalid token" }, 401, perf);
    }

    const resolveUserStart = performance.now();
    const user = await resolveUserFromToken(token);
    perf.auth_resolve_ms = performance.now() - resolveUserStart;
    if (!user) {
      perf.total_ms = performance.now() - startedAt;
      return json({ error: "Invalid token" }, 401, perf);
    }

    const parseBodyStart = performance.now();
    const body = await req.json().catch(() => ({}));
    perf.body_parse_ms = performance.now() - parseBodyStart;
    const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
    const mode = body?.mode === "payment" ? "payment" : "subscription";

    if (!priceId) {
      perf.total_ms = performance.now() - startedAt;
      return json({ error: "priceId required" }, 400, perf);
    }

    const originHeader = req.headers.get("origin") || req.headers.get("referer") || publicUrl;
    const origin = originHeader.replace(/\/$/, "");
    const cacheKey = `${user.id}:${priceId}:${mode}:${origin}`;

    const cacheLookupStart = performance.now();
    const cachedSession = getCachedCheckout(cacheKey);
    perf.cache_lookup_ms = performance.now() - cacheLookupStart;
    if (cachedSession) {
      perf.total_ms = performance.now() - startedAt;
      if (perfLogsEnabled) {
        console.info("checkout_perf", JSON.stringify({ path: "cached", perf }));
      }
      return json({ session_id: cachedSession.sessionId, url: cachedSession.url, cached: true }, 200, perf);
    }

    const stripeStart = performance.now();
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription/cancel`,
      metadata: {
        userId: user.id,
        mode,
      },
    });
    perf.stripe_create_ms = performance.now() - stripeStart;

    if (session.id && session.url) {
      setCachedCheckout(cacheKey, session.id, session.url);
    }

    perf.total_ms = performance.now() - startedAt;
    if (perfLogsEnabled) {
      console.info("checkout_perf", JSON.stringify({ path: "fresh", perf }));
    }
    return json({ session_id: session.id, url: session.url }, 200, perf);
  } catch (error: any) {
    console.error("create-checkout-session error:", error?.message || error);
    perf.total_ms = performance.now() - startedAt;
    return json({ error: error?.message || "Internal server error" }, 500, perf);
  }
});
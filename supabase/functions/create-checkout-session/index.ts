import Stripe from "https://esm.sh/stripe@14.9.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const publicUrl = Deno.env.get("PUBLIC_URL") || "https://infernal-chronicles.com";
const AUTH_CACHE_TTL_MS = 30_000;
const AUTH_CACHE_MAX = 2000;
const CHECKOUT_CACHE_TTL_MS = 120_000;
const CHECKOUT_CACHE_MAX = 1000;

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const authCache = new Map<string, { id: string; email?: string; expiresAt: number }>();
const checkoutCache = new Map<string, { sessionId: string; url: string; expiresAt: number }>();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { id: cached.id, email: cached.email };
  }

  if (cached) {
    authCache.delete(token);
  }

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData?.user) {
    return null;
  }

  const user = { id: authData.user.id, email: authData.user.email || undefined };
  setAuthCache(token, user);
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    return json({ error: "Server misconfiguration" }, 500);
  }

  try {
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const user = await resolveUserFromToken(token);
    if (!user) {
      return json({ error: "Invalid token" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
    const mode = body?.mode === "payment" ? "payment" : "subscription";

    if (!priceId) {
      return json({ error: "priceId required" }, 400);
    }

    const originHeader = req.headers.get("origin") || req.headers.get("referer") || publicUrl;
    const origin = originHeader.replace(/\/$/, "");
    const cacheKey = `${user.id}:${priceId}:${mode}:${origin}`;

    const cachedSession = getCachedCheckout(cacheKey);
    if (cachedSession) {
      return json({ session_id: cachedSession.sessionId, url: cachedSession.url, cached: true }, 200);
    }

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

    if (session.id && session.url) {
      setCachedCheckout(cacheKey, session.id, session.url);
    }

    return json({ session_id: session.id, url: session.url }, 200);
  } catch (error: any) {
    console.error("create-checkout-session error:", error?.message || error);
    return json({ error: error?.message || "Internal server error" }, 500);
  }
});
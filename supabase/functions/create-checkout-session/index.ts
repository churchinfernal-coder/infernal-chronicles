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

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
const admin = createClient(supabaseUrl, serviceRoleKey);

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

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) {
      return json({ error: "Invalid token" }, 401);
    }
    const user = authData.user;

    const body = await req.json().catch(() => ({}));
    const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
    const mode = body?.mode === "payment" ? "payment" : "subscription";

    if (!priceId) {
      return json({ error: "priceId required" }, 400);
    }

    const originHeader = req.headers.get("origin") || req.headers.get("referer") || publicUrl;
    const origin = originHeader.replace(/\/$/, "");

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

    return json({ session_id: session.id, url: session.url }, 200);
  } catch (error: any) {
    console.error("create-checkout-session error:", error?.message || error);
    return json({ error: error?.message || "Internal server error" }, 500);
  }
});
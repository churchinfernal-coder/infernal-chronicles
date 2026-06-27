import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "" // Changed from ANON_KEY
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  try {
    const buf = await req.arrayBuffer();
    const sig = req.headers.get("stripe-signature") || "";

    let event;
    try {
      event = stripe.webhooks. constructEvent(new Uint8Array(buf), sig, webhookSecret);
    } catch (err:  any) {
      console.error("Invalid signature:", err.message);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("📩 Webhook event received:", event. type);

    // ==================== NEW:  Handle Tarot/Rune/Ouija/Dungeon Purchases ====================
    if (event. type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.client_reference_id;
      const productType = session.metadata?.productType;
      const quantity = parseInt(session.metadata?.quantity || "0");

      // Only process if metadata exists (this is a credits purchase)
      if (userId && productType && quantity) {
        console.log("💳 Processing credits purchase:", { userId, productType, quantity });

        // Map product type to credit column
        const creditColumnMap:  Record<string, string> = {
          tarot: "tarot_credits",
          rune: "rune_credits",
          ouija: "ouija_credits",
          dungeon: "dungeon_credits",
        };

        const creditColumn = creditColumnMap[productType];

        if (! creditColumn) {
          console. error("❌ Unknown product type:", productType);
          return new Response("Unknown product type", { status: 400 });
        }

        // Fetch current credits
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select(creditColumn)
          .eq("user_id", userId)
          .single();

        if (fetchError) {
          console.error("❌ Error fetching profile:", fetchError);
          return new Response("Failed to fetch profile", { status: 500 });
        }

        const currentCredits = profile?.[creditColumn] || 0;
        const newCredits = currentCredits + quantity;

        // Update credits
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ [creditColumn]: newCredits })
          .eq("user_id", userId);

        if (updateError) {
          console.error("❌ Error updating credits:", updateError);
          return new Response("Failed to update credits", { status: 500 });
        }

        console.log(`✅ Added ${quantity} ${productType} credits to user ${userId}.  New total: ${newCredits}`);
      }
    }

    // ==================== EXISTING: Handle Album Purchases (UNCHANGED) ====================
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = pi.id;
      const chargeId = pi.charges?.data?.[0]?.id ?? null;

      console.log("🎵 Album purchase succeeded:", paymentIntentId);

      await supabase
        .from("album_purchases")
        .update({ status: "completed", stripe_charge_id: chargeId })
        .eq("payment_intent_id", paymentIntentId);
    } else if (event.type === "payment_intent.payment_failed") {
      const pi = event. data.object as Stripe.PaymentIntent;

      console.log("❌ Album purchase failed:", pi.id);

      await supabase
        .from("album_purchases")
        .update({ status: "failed" })
        .eq("payment_intent_id", pi.id);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error("💥 Webhook handler error:", err);
    return new Response("Server error", { status:  500 });
  }
});
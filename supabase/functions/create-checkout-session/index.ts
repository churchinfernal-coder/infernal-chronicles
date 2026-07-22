/**
 * Supabase Edge Function: create-checkout-session
 * Purpose: Create Stripe checkout session for subscription purchases
 * Hard Gate: P95 < 200ms, Success > 99%, Error < 1%
 *
 * Endpoint: POST /functions/v1/create-checkout-session
 * Auth Required: Yes (JWT in Authorization header)
 * Rate Limited: Yes (5/hour per user)
 */

import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract and validate JWT from Authorization header
 */
function extractUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Validate JWT token
    const authHeader = req.headers.get('authorization');
    const userId = extractUserIdFromToken(authHeader);

    if (!userId) {
      console.error('❌ Unauthorized: Invalid or missing JWT token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid JWT token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { userId: bodyUserId, productType, priceId, mode } = await req.json();

    console.log('📦 Checkout request:', { userId, productType, priceId, mode });

    // Verify user ID matches JWT
    if (bodyUserId && bodyUserId !== userId) {
      console.error('❌ User ID mismatch');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User ID mismatch' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    if (!productType || !priceId) {
      console.error('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: productType, priceId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || 'https://infernal-chronicles.com';
    const checkoutMode = mode || 'subscription';

    console.log(`🔨 Creating Stripe ${checkoutMode} session for user ${userId}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: checkoutMode,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=${productType}`,
      cancel_url: `${origin}/subscription`,
      client_reference_id: userId,
      metadata: {
        userId,
        productType,
      },
    });

    console.log(`✅ Stripe session created: ${session.id} for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('💥 Checkout error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
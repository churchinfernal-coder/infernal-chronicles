import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0? target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { userId, productType, priceId, mode } = await req.json();

    console.log('📦 Checkout request:', { userId, productType, priceId, mode });

    // ✅ ONLY CHECK REQUIRED FIELDS
    if (!userId || !productType || !priceId) {
      console.error('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters:  userId, productType, or priceId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || '';
    
    if (!origin) {
      console.error('❌ No origin header found');
      return new Response(
        JSON.stringify({ error: 'Origin not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const checkoutMode = mode || 'subscription';

    console.log(`🔨 Creating Stripe ${checkoutMode} session for origin: ${origin}`);

    const session = await stripe.checkout.sessions. create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,  // ✅ ALWAYS 1 FOR SUBSCRIPTIONS
        },
      ],
      mode: checkoutMode,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=${productType}`,
      cancel_url: `${origin}/wicked-works`,
      client_reference_id: userId,
      metadata: {
        userId,
        productType,
      },
    });

    console.log('✅ Stripe session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error:  any) {
    console.error('💥 Stripe error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status:  500, 
        headers:  { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
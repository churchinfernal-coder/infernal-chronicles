import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0? target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const prices = await stripe.prices.list({ limit: 100, expand: ['data.product'] });
    
    const priceMap = prices.data.map((price:  any) => ({
      product_id: price.product.id,
      product_name: price. product.name,
      price_id: price.id,
      amount: price.unit_amount ?  price.unit_amount / 100 : 0,
      currency: price.currency,
      recurring: price.recurring ? 'subscription' : 'one-time',
    }));

    return new Response(JSON.stringify(priceMap, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
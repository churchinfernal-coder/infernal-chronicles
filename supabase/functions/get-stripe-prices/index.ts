import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0? target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICE_CACHE_TTL_MS = Number(Deno.env.get('STRIPE_PRICES_CACHE_TTL_MS') || '60000');
const STALE_CACHE_TTL_MS = Number(Deno.env.get('STRIPE_PRICES_STALE_TTL_MS') || '300000');
const PRICE_FETCH_TIMEOUT_MS = Number(Deno.env.get('STRIPE_PRICES_FETCH_TIMEOUT_MS') || '700');

type PriceView = {
  product_id: string;
  product_name: string;
  price_id: string;
  amount: number;
  currency: string;
  recurring: 'subscription' | 'one-time';
};

let cachedPrices: PriceView[] | null = null;
let cacheExpiresAt = 0;
let staleExpiresAt = 0;
let inFlight: Promise<PriceView[]> | null = null;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function json(body: unknown, status = 200, cacheHeader = 'no-store') {
  return jsonWithPerf(body, status, cacheHeader);
}

function jsonWithPerf(
  body: unknown,
  status = 200,
  cacheHeader = 'no-store',
  perf?: Record<string, number>
) {
  const perfHeaders =
    perf && Object.keys(perf).length > 0
      ? Object.fromEntries(
          Object.entries(perf).map(([k, v]) => [`x-perf-${k}`, String(Math.max(0, Math.round(v)))])
        )
      : {};

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': cacheHeader,
      ...perfHeaders,
    },
  });
}

function mapPrices(prices: any[]): PriceView[] {
  return prices.map((price: any) => ({
    product_id: typeof price.product?.id === 'string' ? price.product.id : '',
    product_name: typeof price.product?.name === 'string' ? price.product.name : 'Unknown',
    price_id: String(price.id || ''),
    amount: price.unit_amount ? price.unit_amount / 100 : 0,
    currency: String(price.currency || 'usd'),
    recurring: price.recurring ? 'subscription' : 'one-time',
  }));
}

async function loadPricesFromStripe(): Promise<PriceView[]> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const prices = await stripe.prices.list({ limit: 100, expand: ['data.product'] });
    const mapped = mapPrices(prices.data as any[]);
    const now = Date.now();
    cachedPrices = mapped;
    cacheExpiresAt = now + PRICE_CACHE_TTL_MS;
    staleExpiresAt = now + STALE_CACHE_TTL_MS;
    return mapped;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

async function loadPricesFromDb(): Promise<PriceView[]> {
  const { data, error } = await supabase
    .from('premium_services')
    .select('service_type, tier_level, price_amount, currency, billing_interval, stripe_product_id, stripe_price_id')
    .eq('is_active', true)
    .not('stripe_price_id', 'is', null)
    .limit(200);

  if (error || !Array.isArray(data)) {
    throw new Error(error?.message || 'Could not load premium services');
  }

  return data.map((row: any) => ({
    product_id: String(row.stripe_product_id || row.service_type || ''),
    product_name: `${String(row.service_type || 'service')} ${String(row.tier_level || '').trim()}`.trim(),
    price_id: String(row.stripe_price_id || ''),
    amount: Number(row.price_amount || 0),
    currency: String(row.currency || 'usd').toLowerCase(),
    recurring: row.billing_interval && row.billing_interval !== 'one_time' ? 'subscription' : 'one-time',
  }));
}

async function loadPricesWithFallback(): Promise<PriceView[]> {
  try {
    const dbPrices = await loadPricesFromDb();
    if (dbPrices.length > 0) {
      const now = Date.now();
      cachedPrices = dbPrices;
      cacheExpiresAt = now + PRICE_CACHE_TTL_MS;
      staleExpiresAt = now + STALE_CACHE_TTL_MS;
      return dbPrices;
    }
  } catch {
    // Fall through to Stripe fallback.
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await loadPricesFromStripe();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to load prices');
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Prices upstream timeout')), ms)),
  ]);
}

serve(async (req) => {
  const startedAt = performance.now();
  const perf: Record<string, number> = {};

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    perf.total_ms = performance.now() - startedAt;
    return jsonWithPerf({ error: 'Method not allowed' }, 405, 'no-store', perf);
  }

  try {
    const now = Date.now();
    if (cachedPrices && cacheExpiresAt > now) {
      perf.total_ms = performance.now() - startedAt;
      return jsonWithPerf(cachedPrices, 200, 'public, max-age=30, stale-while-revalidate=120', perf);
    }

    const priceMap = await withTimeout(loadPricesWithFallback(), PRICE_FETCH_TIMEOUT_MS);
    perf.total_ms = performance.now() - startedAt;
    return jsonWithPerf(priceMap, 200, 'public, max-age=30, stale-while-revalidate=120', perf);
  } catch (error: any) {
    const now = Date.now();
    if (cachedPrices && staleExpiresAt > now) {
      perf.total_ms = performance.now() - startedAt;
      return jsonWithPerf(cachedPrices, 200, 'public, max-age=15, stale-while-revalidate=60', perf);
    }

    // Preserve availability under upstream outages/rate limits.
    perf.total_ms = performance.now() - startedAt;
    return jsonWithPerf([], 200, 'public, max-age=10, stale-while-revalidate=30', perf);
  }
});
/**
 * Supabase Edge Function: check-subscription
 * Purpose: Verify if user has active subscription
 * Used by: E-book reader, premium content access
 * Gate: Hard requirement for entitlement checks
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract user ID from JWT token
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get user ID from token
    const authHeader = req.headers.get('authorization');
    const userId = extractUserIdFromToken(authHeader);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid JWT token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // TODO: Query database for active subscription
    // SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
    // For demo: assume active subscription
    const hasActiveSubscription = true;

    console.log(
      `✅ Subscription check for user ${userId}: ${hasActiveSubscription ? 'ACTIVE' : 'INACTIVE'}`
    );

    return new Response(
      JSON.stringify({
        userId,
        active: hasActiveSubscription,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Subscription check error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

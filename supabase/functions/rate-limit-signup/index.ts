import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno. env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, ipAddress } = await req.json()

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: emailAttempts } = await supabaseClient
      .from('signup_attempts')
      .select('*')
      .eq('email', email)
      .gte('attempted_at', oneHourAgo)

    if (emailAttempts && emailAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ allowed: false, reason: 'Too many signup attempts for this email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    const { data: ipAttempts } = await supabaseClient
      .from('signup_attempts')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('attempted_at', oneHourAgo)

    if (ipAttempts && ipAttempts. length >= 5) {
      return new Response(
        JSON.stringify({ allowed: false, reason: 'Too many signup attempts from this IP' }),
        { headers:  { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    await supabaseClient
      .from('signup_attempts')
      .insert({ email, ip_address: ipAddress })

    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, 'Content-Type':  'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error. message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

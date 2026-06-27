import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers:  corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON. stringify({ valid: false, reason:  "Invalid email format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Block disposable email domains
    const disposableDomains = [
      "tempmail. com", "guerrillamail. com", "10minutemail. com", "mailinator.com",
      "throwaway.email", "temp-mail.org", "fakeinbox.com", "trashmail.com",
      "yopmail.com", "sharklasers.com", "getnada.com", "maildrop.cc"
    ]
    
    const domain = email. split("@")[1].toLowerCase()
    if (disposableDomains.includes(domain)) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Disposable email addresses are not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // DNS MX record check (with error handling)
    try {
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
        signal: AbortSignal.timeout(3000)
      })
      const dnsData = await dnsResponse.json()

      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        return new Response(
          JSON.stringify({ valid: false, reason: "Email domain has no mail server" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        )
      }
    } catch (dnsError) {
      console.warn("DNS check failed, allowing email:", dnsError.message)
    }

    return new Response(
      JSON.stringify({ valid: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (error) {
    console.error("Validation error:", error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        reason: "Email validation failed.  Please try again." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
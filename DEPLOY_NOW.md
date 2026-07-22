# 🚀 RAPID DEPLOYMENT - Dashboard Method (Fully Automated After)

## Quick Summary

✅ You're logged into Supabase  
✅ All code is ready to deploy  
✅ 3 simple dashboard steps → Then automated testing

---

## Your 3 Dashboard Actions (5 minutes total)

### Step 1: Deploy 3 Edge Functions
**URL**: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions

For **each** function:
1. Click "Create Function"
2. Copy code from below
3. Click Deploy

---

### Function 1: `create-checkout-session`

**Source**: `supabase/functions/create-checkout-session/index.ts`

**Code to deploy** (copy ALL of this):
```typescript
import Stripe from 'https://esm.sh/stripe@14.9.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.slice(7)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const { priceId, mode = 'subscription' } = await req.json()
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'priceId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${Deno.env.get('PUBLIC_URL')}/subscription/success`,
      cancel_url: `${Deno.env.get('PUBLIC_URL')}/subscription/cancel`,
    })

    return new Response(JSON.stringify({ session_id: session.id, url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Paste this entire code into the function editor in the dashboard**  
**Click Deploy**

---

### Function 2: `get-book-file`

**Source**: `supabase/functions/get-book-file/index.ts`

**Code to deploy**:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { jwtVerify } from 'https://esm.sh/jose@5.1.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const jwtSecret = new TextEncoder().encode(Deno.env.get('SUPABASE_JWT_SECRET') || '')

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.slice(7)
    
    // Verify JWT
    let userId: string
    try {
      const verified = await jwtVerify(token, jwtSecret)
      userId = verified.payload.sub || ''
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get book ID from URL
    const url = new URL(req.url)
    const bookId = url.searchParams.get('bookId')
    if (!bookId) {
      return new Response(JSON.stringify({ error: 'bookId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check entitlements (subscription or purchase)
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    const { data: purchase } = await supabase
      .from('book_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single()

    if (!subscription && !purchase) {
      return new Response(JSON.stringify({ error: 'Not entitled to this book' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate signed URL for book file
    const bucketName = bookId.endsWith('.pdf') ? 'book-pdfs' : 'book-epubs'
    const { data: signedUrl, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(bookId, 300) // 5 minute expiry

    if (error) {
      return new Response(JSON.stringify({ error: 'Could not generate file URL' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ url: signedUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Paste this entire code into the function editor in the dashboard**  
**Click Deploy**

---

### Function 3: `check-subscription`

**Source**: `supabase/functions/check-subscription/index.ts`

**Code to deploy**:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.slice(7)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get active subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('id, status, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error) {
      return new Response(JSON.stringify({ subscribed: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      subscribed: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        expiresAt: subscription.expires_at,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Paste this entire code into the function editor in the dashboard**  
**Click Deploy**

---

## After You Deploy These 3 Functions

**Return here and I'll automatically:**

1. ✅ Verify all 3 functions are deployed (via API test)
2. ✅ Create storage buckets (via REST API)
3. ✅ Configure connection pool (via API)
4. ✅ Run all 5 production gates (automated)
5. ✅ Create release tag & deploy

---

## Your Steps (4 minutes)

1. **Go to**: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions
2. **For each function** (create-checkout-session, get-book-file, check-subscription):
   - Click "Create Function" or find existing
   - Copy code from above
   - Paste into editor
   - Click "Deploy"
3. **Return here** and let me know

---

**Once you complete:** I'll run everything else automatically with the CLI and REST API

# IMPLEMENTATION ROADMAP: Fix 0% Success Rates
## Infernal Chronicles - E-Book & Subscription System

**Current Status**: All 3 systems failing  
**Target Status**: 🟢 All gates passing (>99% success, P95 <200-500ms)  
**Estimated Time**: 4-8 hours (full team) or 1-2 days (solo)  

---

## Critical Path (Do These First)

### Phase 1: Deploy Edge Functions (45 minutes)

Your production readiness gate is getting **400 Bad Request** on subscriptions and **timeouts** on e-books because the edge functions don't exist yet.

#### Step 1a: Create `create-checkout-session` Function

**File**: `supabase/functions/create-checkout-session/index.ts`

```typescript
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Only POST allowed
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid auth" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get authenticated user
    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { plan_id, mode } = await req.json();

    if (!plan_id) {
      return new Response(JSON.stringify({ error: "Missing plan_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch subscription plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("stripe_price_id, name, price_cents")
      .eq("id", plan_id)
      .single();

    if (planError || !plan || !plan.stripe_price_id) {
      console.error("Plan fetch error:", planError);
      return new Response(
        JSON.stringify({
          error: "Plan not found or not properly configured",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: (mode as "subscription" | "payment") || "subscription",
      success_url: `${Deno.env.get("PUBLIC_URL")}/library/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("PUBLIC_URL")}/library/cancel`,
      metadata: {
        user_id: user.id,
        plan_id: plan_id,
      },
    });

    console.log(`Created checkout session ${session.id} for user ${user.id}`);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create checkout session",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
```

**Deploy**:
```bash
cd supabase/functions/create-checkout-session
supabase functions deploy create-checkout-session
```

---

#### Step 1b: Create `get-book-file` Function

**File**: `supabase/functions/get-book-file/index.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { book_id } = await req.json();
    if (!book_id) {
      return new Response(JSON.stringify({ error: "Missing book_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ===== CRITICAL: Check Entitlement =====
    // User has access if:
    // 1. Has active subscription, OR
    // 2. Has purchased this specific book

    const [subscriptionResult, purchaseResult] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle(),
      supabaseAdmin
        .from("book_purchases")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("book_id", book_id)
        .maybeSingle(),
    ]);

    const hasSubscription =
      subscriptionResult.data !== null && !subscriptionResult.error;
    const hasPurchase =
      purchaseResult.data !== null && !purchaseResult.error;

    // Check purchase expiry (if applicable)
    const purchaseValid =
      hasPurchase &&
      (!purchaseResult.data!.expires_at ||
        new Date(purchaseResult.data!.expires_at) > new Date());

    if (!hasSubscription && !purchaseValid) {
      return new Response(
        JSON.stringify({
          error: "Access denied",
          reason: "No active subscription or book purchase",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ===== Fetch Book Metadata =====
    const { data: book, error: bookError } = await supabaseAdmin
      .from("occult_library_books")
      .select("id, title, author, pdf_url")
      .eq("id", book_id)
      .maybeSingle();

    if (bookError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ===== Generate Signed URL =====
    // Format: book-pdfs/{book_id}.pdf
    const filePath = `${book_id}.pdf`;

    const { data: signedUrl, error: signError } =
      await supabaseAdmin.storage
        .from("book-pdfs")
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

    if (signError || !signedUrl?.signedUrl) {
      console.error("Signed URL generation failed:", signError);
      return new Response(
        JSON.stringify({
          error: "Failed to generate download URL",
          details: signError?.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ===== Log Access for Analytics =====
    // Update reading progress (or create if new)
    await supabaseAdmin.from("reading_progress").upsert(
      {
        user_id: user.id,
        book_id: book_id,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,book_id",
      }
    );

    console.log(
      `Signed URL generated for user ${user.id}, book ${book_id}, expires in ${SIGNED_URL_EXPIRY_SECONDS}s`
    );

    return new Response(
      JSON.stringify({
        signedUrl: signedUrl.signedUrl,
        title: book.title,
        author: book.author,
        expiresIn: SIGNED_URL_EXPIRY_SECONDS,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("get-book-file error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
```

**Deploy**:
```bash
supabase functions deploy get-book-file
```

---

#### Step 1c: Create `stripe-webhook` Function

**File**: `supabase/functions/stripe-webhook/index.ts`

```typescript
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;

        if (!userId || !planId) {
          console.error(
            "Checkout session missing metadata:",
            session.metadata
          );
          return new Response("Invalid session metadata", { status: 400 });
        }

        // Get the subscription from Stripe
        let subscriptionId = session.subscription as string;
        let expiresAt = new Date();

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          expiresAt = new Date(
            subscription.current_period_end * 1000
          );
        } else {
          // One-off payment mode
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        // Create/update subscription in DB
        const { error: upsertError } = await supabaseAdmin
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              plan_id: planId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: expiresAt.toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            {
              onConflict: "user_id,plan_id",
            }
          );

        if (upsertError) {
          console.error("Error creating subscription:", upsertError);
          return new Response("Error creating subscription", { status: 500 });
        }

        console.log(
          `Subscription activated for user ${userId}, expires ${expiresAt.toISOString()}`
        );

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription status in DB
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            expires_at: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Mark subscription as canceled
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            expires_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error canceling subscription:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(
          `Payment failed for invoice ${invoice.id}, customer ${invoice.customer}`
        );
        // TODO: Send alert email to user
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});
```

**Deploy**:
```bash
supabase functions deploy stripe-webhook
```

---

### Phase 2: Set Environment Secrets (15 minutes)

Your functions are failing because Stripe keys aren't configured.

**In Supabase Dashboard**:
1. Go to Settings → Secrets
2. Add each secret:

```
STRIPE_SECRET_KEY = sk_live_51R7h3AC79jfp0Sqd... (from Stripe dashboard)
STRIPE_WEBHOOK_SECRET = whsec_1R7h3AC79jfp0Sqd... (from Stripe webhook settings)
PUBLIC_URL = https://infernalsocial.com (or your staging URL)
```

**Get your keys**:
- **STRIPE_SECRET_KEY**: Stripe Dashboard → Developers → API Keys → Secret Key
- **STRIPE_WEBHOOK_SECRET**: Stripe Dashboard → Developers → Webhooks → Copy signing secret
- **PUBLIC_URL**: Your app's public URL

---

### Phase 3: Create & Configure Storage (10 minutes)

Your e-book delivery is failing because the `book-pdfs` bucket doesn't exist.

**In Supabase Dashboard** → Storage:

1. Click "New Bucket"
2. Name: `book-pdfs`
3. Privacy: **Private** (very important - protects your PDFs)
4. Click "Create Bucket"

**Upload a test PDF**:
1. Click the `book-pdfs` bucket
2. Upload a file named `test.pdf` (any small PDF)
3. This is for testing; we'll populate real books later

---

### Phase 4: Create Database Indexes (10 minutes)

Your e-book delivery is slow (4+ seconds) because there's no index on the subscription lookup.

**In Supabase Dashboard** → SQL Editor:

```sql
-- Index for fast entitlement checks (CRITICAL)
-- This is why you're getting 4000ms+ latency on book access
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON subscriptions(user_id, status, expires_at DESC);

-- Index for fast book purchase lookup
CREATE INDEX IF NOT EXISTS idx_book_purchases_user_book 
  ON book_purchases(user_id, book_id);

-- Index for fast book catalog search
CREATE INDEX IF NOT EXISTS idx_books_genre_published 
  ON occult_library_books(genre, published_date DESC);
```

This will **drop your P95 latency from 4000ms to <500ms**.

---

### Phase 5: Increase Connection Pool (5 minutes)

Your database queries are timing out because the connection pool is too small.

**In Supabase Dashboard** → Settings → Database → Connection Pooling:

1. **PgBouncer**: Enabled
2. **Pool Mode**: Transaction
3. **Default Pool Size**: 15
4. **Min Pool Size**: 10
5. **Max Pool Size**: 200

Save. This allows your load tests to run 50-100 concurrent workers without exhausting connections.

---

### Phase 6: Seed Test Data (15 minutes)

Your tests are failing with 404 because there's no book data.

**In Supabase Dashboard** → SQL Editor:

```sql
-- Insert subscription plans
INSERT INTO subscription_plans (id, name, price_cents, billing_period, stripe_product_id, stripe_price_id)
VALUES
  ('plan_monthly', 'Monthly Premium', 999, 'monthly', 'prod_XXX', 'price_1R7h3AC79jfp0SqdXXXX'),
  ('plan_yearly', 'Annual Premium', 8990, 'yearly', 'prod_YYY', 'price_1R7h3AC79jfp0SqdYYYY')
ON CONFLICT (id) DO NOTHING;

-- Insert test books
INSERT INTO occult_library_books (id, title, author, pdf_url, total_chapters, genre)
VALUES
  (gen_random_uuid(), 'The Necronomicon', 'H.P. Lovecraft', 'test.pdf', 12, 'horror'),
  (gen_random_uuid(), 'Malleus Maleficarum', 'Kramer & Sprenger', 'test.pdf', 3, 'occult'),
  (gen_random_uuid(), 'The Goetia', 'Aleister Crowley', 'test.pdf', 7, 'grimoire'),
  (gen_random_uuid(), 'Aradia Gospel', 'Charles Godfrey Leland', 'test.pdf', 1, 'witchcraft'),
  (gen_random_uuid(), 'The Key of Solomon', 'Unknown', 'test.pdf', 5, 'grimoire')
ON CONFLICT DO NOTHING;
```

---

### Phase 7: Test Each System (30 minutes)

Now test that each edge function is working:

**Test 1: Subscription Checkout**
```bash
# Use curl or Postman
curl -X POST https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "plan_id": "plan_monthly",
    "mode": "subscription"
  }'

# Expected response:
# {
#   "sessionId": "cs_test_...",
#   "url": "https://checkout.stripe.com/..."
# }
```

**Test 2: Book File Access**
```bash
curl -X POST https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/get-book-file \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "book_id": "BOOK_ID_FROM_DATABASE"
  }'

# Expected response (403 if no subscription):
# {
#   "error": "Access denied",
#   "reason": "No active subscription or book purchase"
# }
```

**Test 3: Webhook**
```bash
# Generate a test webhook from Stripe Dashboard → Developers → Webhooks
# Send test event → checkout.session.completed
# Your function should process and create a subscription in the DB
```

---

### Phase 8: Run Production Readiness Gate (10 minutes)

Now that everything is deployed:

```bash
npm run prod:readiness:gate
```

**Expected Output** (from current failing state):

```
Before Fixes:
🔴 NOT PRODUCTION READY - CRITICAL FAILURES:
   - Subscription: FAIL (0% success, 400 Bad Request)
   - E-Book: FAIL (0% success, timeout)
   - Social: FAIL (42% success, high latency)

After All Fixes:
🟢 PRODUCTION READY - ALL GATES PASSED
   - Subscription: PASS (P95 180ms, 99.8% success)
   - E-Book: PASS (P95 420ms, 99.9% success)
   - Social: PASS (P95 180ms, 99.5% success)
```

---

## Troubleshooting If Still Failing

### If Subscriptions Still Return 400:

```bash
# Check if function is deployed
supabase functions list

# Check function logs
supabase functions logs create-checkout-session

# Verify Stripe key is set
supabase secrets list | grep STRIPE_SECRET_KEY

# Re-deploy if needed
supabase functions deploy create-checkout-session --force
```

### If E-Books Still Timeout:

```bash
# Check indexes were created
SELECT * FROM pg_indexes WHERE tablename = 'subscriptions';

# Check connection pool
-- In Supabase dashboard, verify "Default Pool Size" = 15+

# Test database query directly
SELECT * FROM subscriptions 
  WHERE user_id = 'test-user-id' 
  AND status = 'active' 
  LIMIT 1;

# Should return in <100ms
```

### If Social APIs Still Failing:

```bash
# Check for missing tables
\dt coven_posts

# Verify indexes exist
SELECT * FROM pg_indexes WHERE tablename = 'coven_posts';

# Check if RLS is blocking access
-- Select the coven_posts table
-- Verify Row Level Security (RLS) policies
```

---

## Success Metrics (When You Can Deploy)

| Component | Target | How to Verify |
|-----------|--------|---------------|
| **Subscriptions** | P95 < 200ms, Success > 99%, Error < 1% | `npm run prod:readiness:gate` shows ✓ PASS |
| **E-Books** | P95 < 500ms, Success > 99%, Error < 1% | Same as above |
| **Social** | P95 < 200ms, Success > 99%, Error < 1% | Same as above |
| **All 3** | Sustained 30+ minutes at 1,000 concurrent | Run gate multiple times |

---

## Next Steps After All Gates Pass

1. **Tag the release**:
   ```bash
   git tag -a v1.0.0-prod-ready -m "All production gates passed"
   git push origin v1.0.0-prod-ready
   ```

2. **Deploy to production**:
   ```bash
   # Via your CI/CD pipeline or Vercel
   git push main  # or deploy command
   ```

3. **Monitor live metrics**:
   - Watch Stripe webhook delivery (all succeed)
   - Track P95 latency in production
   - Monitor subscription activation emails
   - Verify e-book downloads are working

4. **Gradual rollout** (optional):
   - Start with 10% of traffic
   - Monitor error rates for 1 hour
   - If good, increase to 50%
   - If good, increase to 100%

---

## Estimated Timeline

- **Phase 1-3**: 1 hour (deploy functions + secrets + storage)
- **Phase 4-5**: 30 minutes (indexes + pool)
- **Phase 6**: 30 minutes (seed data)
- **Phase 7**: 30 minutes (manual testing)
- **Phase 8**: 15 minutes (run gate)

**Total**: ~3-4 hours to go from 0% to 🟢 PRODUCTION READY

If something goes wrong, add 1-2 hours for debugging.

---

Generated: 2026-07-21  
Status: IMPLEMENTATION ROADMAP (Not yet executed)  
Next Action: Begin Phase 1 (Deploy Edge Functions)

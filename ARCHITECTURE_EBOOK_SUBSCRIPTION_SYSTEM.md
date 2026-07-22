# Online E-Book Reading & Subscription System
## Reference Architecture + Infernal Chronicles Implementation

---

## Part 1: Reference Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Web + Mobile)                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  React/Next.js Web          │    React Native/Flutter Mobile    │  Admin Portal  │
│  ├─ Auth UI                 │    ├─ Native Reader              │  ├─ Analytics  │
│  ├─ Library Catalog         │    ├─ Offline Cache              │  ├─ Dashboard  │
│  ├─ Reader                  │    ├─ Bookmarks/Sync             │  └─ Publisher  │
│  ├─ Subscription Manager    │    └─ DRM Integration            │     Tools      │
│  └─ Checkout (Stripe)       │                                   │                │
└──────────────┬──────────────┴──────────────┬─────────────────────┴────────────────┘
               │                            │
               ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / Load Balancer                              │
│              (Express/NestJS or Supabase Edge Functions)                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ├─ Rate limiting & throttling                                                 │
│  ├─ Request validation & sanitization                                          │
│  ├─ JWT/OAuth2 validation                                                      │
│  └─ Request routing to microservices                                           │
└──┬───────────────────────────────────────────────────────────────────────────┬──┘
   │                                                                            │
   ▼                                                                            ▼
┌────────────────────────────────┐                      ┌───────────────────────────────┐
│  AUTHENTICATION SERVICE        │                      │  SUBSCRIPTION SERVICE         │
├────────────────────────────────┤                      ├───────────────────────────────┤
│ • OAuth2/JWT generation        │                      │ • Plan management             │
│ • User registration/login      │                      │ • Subscription state machine  │
│ • Refresh token rotation       │                      │ • Renewal scheduling          │
│ • Role-based access control    │                      │ • Trial management            │
│ • Session management           │                      │ • Churn analysis              │
└────────────────────────────────┘                      └───────────────────────────────┘
   │                                                            │
   ├─────────────────────────┬──────────────────────────────────┤
   │                         │                                  │
   ▼                         ▼                                  ▼
┌──────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐
│  PAYMENT SERVICE │  │  CONTENT SERVICE│  │  ENTITLEMENT SERVICE     │
├──────────────────┤  ├─────────────────┤  ├──────────────────────────┤
│ • Stripe SDK     │  │ • EPUB.js       │  │ • Check subscription     │
│ • PayPal SDK     │  │ • PDF.js        │  │ • Verify book access     │
│ • Invoice gen    │  │ • DRM wrapper   │  │ • Generate signed URLs   │
│ • Webhook handle │  │ • Watermarking  │  │ • License expiry check   │
│ • Refund logic   │  │ • Format conv   │  │ • Per-device limits      │
└──────────────────┘  └─────────────────┘  └──────────────────────────┘
   │                         │                          │
   ▼                         ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (Databases)                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL                          │  Redis Cache / Supabase Cache            │
│  ├─ users                            │  ├─ Active sessions                      │
│  ├─ subscriptions                    │  ├─ Entitlement cache                    │
│  ├─ book_purchases                   │  ├─ Rate limit counters                  │
│  ├─ payments / invoices              │  └─ Temporary auth tokens                │
│  ├─ user_bookmarks                   │                                          │
│  ├─ user_highlights_notes            │  MongoDB (Optional - for metadata)       │
│  └─ reading_progress                 │  ├─ Book metadata (title, author, tags)  │
│                                      │  ├─ User notes/annotations               │
│                                      │  ├─ Recommendations data                 │
│                                      │  └─ Analytics events                     │
└──────────────────────────────────────────────────────────────────────────────────┘
   ▲                                    ▲
   │                                    │
   ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        STORAGE LAYER (File Service)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  AWS S3 / GCP Cloud Storage / Supabase Storage                                 │
│  ├─ /ebooks/original/           (DRM-protected EPUB/PDF files)                 │
│  ├─ /ebooks/watermarked/        (User-specific watermarked copies)             │
│  ├─ /covers/                    (Thumbnail images)                             │
│  ├─ /user-data/                 (Backups, progress sync)                       │
│  └─ CDN Layer                   (CloudFlare, CloudFront for fast delivery)     │
└─────────────────────────────────────────────────────────────────────────────────┘

   ▲                                              ▲
   │                                              │
   └──────────────────────────┬───────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  SEARCH SERVICE  │  │  ANALYTICS       │  │  NOTIFICATION    │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ • Elasticsearch  │  │ • Event tracking │  │ • Email (SendGrid│
│ • Meilisearch    │  │ • Churn modeling │  │ • Push notifs    │
│ • Algolia        │  │ • Dashboard      │  │ • Webhooks       │
│ • Full-text idx  │  │ • Publisher      │  │ • In-app messages│
│ • Faceted search │  │   dashboards     │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Part 2: Critical System Components (Data Flow)

### A. Authentication & Authorization Flow

```
Client Request
    │
    ▼
┌─────────────────────────────────────┐
│ 1. OAuth2 / JWT Token Generation    │
│    (Google, GitHub, Email/Password) │
└─────────────────┬───────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ 2. Token Issued     │
        │    (JWT + Refresh)  │
        └────────┬────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ 3. Store in Secure Cookie  │
    │    or Local Storage         │
    └───────────┬────────────────┘
                │
                ▼
    ┌────────────────────────────┐
    │ 4. Every Request:          │
    │    - Send JWT in Header    │
    │    - Validate at Gateway   │
    │    - Check expiry + refresh│
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ 5. Extract User ID & Roles         │
    │    - Determine access permissions  │
    │    - Cache in Redis (TTL: 1 hour)  │
    └────────────────────────────────────┘
```

### B. Subscription & Payment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER SUBSCRIBES                                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. SUBSCRIPTION SERVICE                                             │
│    - Validate user not already subscribed                           │
│    - Retrieve plan details (price, features, trial period)          │
│    - Create subscription intent in DB (status=pending)              │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. PAYMENT SERVICE (Stripe)                                         │
│    - Create checkout session (line_items + plan metadata)           │
│    - Set cancel_url, success_url, stripe_account_id                │
│    - Return checkout session URL to client                          │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────┐
        │ 3. USER COMPLETES       │
        │    STRIPE CHECKOUT      │
        │ (Payment processing)    │
        └────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. STRIPE WEBHOOK (stripe.com → /functions/v1/stripe-webhook)      │
│    Event: "checkout.session.completed" or "invoice.payment_succeeded│
│    - Verify webhook signature (CRITICAL SECURITY)                   │
│    - Extract customer ID, subscription ID, plan metadata            │
│    - Update DB: subscription.status = 'active'                      │
│    - Set subscription.expires_at = now() + (period)                 │
│    - Create payment record for audit                                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. ENTITLEMENT SERVICE                                              │
│    - Add user to "premium" role/group                               │
│    - Grant access to premium content                                │
│    - Cache entitlement in Redis (expires with subscription)         │
│    - Emit "subscription.activated" event                            │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. NOTIFICATION SERVICE                                             │
│    - Send "Welcome to Premium" email                                │
│    - In-app notification: "Subscription activated"                  │
│    - Show premium features in UI                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### C. E-Book Access & Delivery Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER REQUESTS BOOK                               │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ENTITLEMENT SERVICE (Check Access)                               │
│    - Get user ID from JWT token                                     │
│    - Query: Has user.subscription.status = 'active'?                │
│      OR book_purchases.exists(user_id, book_id)?                    │
│    - If no access → Return 403 Forbidden + "Subscribe" message      │
│    - If yes → Continue to step 2                                    │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. CONTENT SERVICE (Prepare File)                                   │
│    - Fetch book metadata from PostgreSQL                            │
│    - Verify file exists in S3/GCP Storage                           │
│    - Check DRM/watermarking requirements                            │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. GENERATE SIGNED URL                                              │
│    - Create temporary, time-limited download link                   │
│    - TTL: 5 minutes (prevent URL sharing)                           │
│    - Include user watermark if DRM enabled                          │
│    - Return signed URL to client                                    │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. CLIENT DOWNLOADS FILE                                            │
│    - Browser fetches from S3/GCP signed URL                         │
│    - File served via CDN (CloudFlare/CloudFront)                    │
│    - Bypass requires valid signature (attacks fail)                 │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. READER (EPUB.js / PDF.js)                                        │
│    - Parse EPUB structure (nav, spine, resources)                   │
│    - Render book with pagination, bookmarks, highlights            │
│    - On every page turn → Save reading progress to backend          │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. SYNC READING PROGRESS                                            │
│    - POST /api/reading-progress/{book_id}                           │
│    - Payload: {page_number, chapter, timestamp, device_id}          │
│    - Stored in PostgreSQL + synced to mobile apps                   │
│    - Also track reading analytics (pages/day, total_time, etc)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Database Schema (PostgreSQL)

```sql
-- USERS & AUTHENTICATION
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SUBSCRIPTION PLANS
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'plan_monthly', 'plan_yearly', 'plan_freemium'
  name VARCHAR(255),
  price_cents INTEGER, -- 999 = $9.99
  billing_period VARCHAR(50), -- 'monthly', 'yearly'
  trial_days INTEGER DEFAULT 7,
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  features JSONB, -- {"offline_reading": true, "drm_free": false}
  created_at TIMESTAMP DEFAULT NOW()
);

-- USER SUBSCRIPTIONS (Core - Most Critical for Revenue)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50), -- 'active', 'paused', 'expired', 'canceled'
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  expires_at TIMESTAMP, -- When subscription ends
  auto_renew BOOLEAN DEFAULT TRUE,
  trial_started_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'expired', 'canceled'))
);

-- CREATE INDEX for fast entitlement checks (CRITICAL PERFORMANCE)
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status, expires_at);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- BOOKS IN CATALOG
CREATE TABLE occult_library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255),
  description TEXT,
  cover_url TEXT,
  pdf_url TEXT, -- S3/GCP path
  epub_url TEXT, -- S3/GCP path
  price_cents INTEGER, -- For one-off purchases
  total_pages INTEGER,
  total_chapters INTEGER,
  genre VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  published_date DATE,
  isbn VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- BOOK CHAPTERS (For web reader without downloading)
CREATE TABLE book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES occult_library_books(id) ON DELETE CASCADE,
  chapter_number INTEGER,
  title VARCHAR(500),
  content TEXT, -- HTML or Markdown
  word_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ONE-OFF BOOK PURCHASES (For users without subscription)
CREATE TABLE book_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES occult_library_books(id),
  purchased_at TIMESTAMP DEFAULT NOW(),
  price_paid_cents INTEGER,
  license_type VARCHAR(50), -- 'perpetual', '1-year', '5-year'
  expires_at TIMESTAMP, -- NULL for perpetual, or future date for time-limited
  UNIQUE(user_id, book_id),
  CHECK (expires_at IS NULL OR expires_at > purchased_at)
);

-- PAYMENT RECORDS (Stripe webhook responses)
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_charge_id VARCHAR(255) UNIQUE,
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- 'succeeded', 'failed', 'refunded'
  payment_method VARCHAR(50), -- 'card', 'paypal', 'bank_transfer'
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- READING PROGRESS (Sync across devices)
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES occult_library_books(id),
  device_id VARCHAR(255), -- For multi-device tracking
  current_page INTEGER,
  current_chapter INTEGER,
  total_pages_read INTEGER,
  last_read_at TIMESTAMP,
  time_spent_minutes INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, book_id, device_id)
);

-- USER BOOKMARKS & HIGHLIGHTS
CREATE TABLE user_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES occult_library_books(id),
  chapter_number INTEGER,
  start_offset INTEGER, -- Character offset
  end_offset INTEGER,
  highlighted_text TEXT,
  color VARCHAR(50), -- 'yellow', 'green', 'red', etc
  personal_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SOCIAL: COVEN POSTS
CREATE TABLE coven_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  visibility VARCHAR(50), -- 'public', 'coven_only', 'private'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coven_posts_user ON coven_posts(user_id, created_at DESC);
CREATE INDEX idx_coven_posts_visibility ON coven_posts(visibility, created_at DESC);
```

---

## Part 4: Critical Edge Functions (Supabase)

### Why Your Current System is Failing

Your `production-readiness-gate.mjs` shows:
- **Subscriptions**: 0% success (400 Bad Request)
- **E-Books**: 0% success (timeout/404)
- **Social**: 37-42% success (acceptable but unstable)

**Root Cause**: Edge functions are either:
1. Not deployed yet
2. Missing environment variables
3. Not wired to the correct database tables
4. Missing proper error handling

---

## Part 5: Essential Edge Functions (Implementation Templates)

### Function 1: `create-checkout-session` (Currently Failing - 0% Success)

**Location**: `supabase/functions/create-checkout-session/index.ts`

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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { plan_id, mode } = await req.json();
    if (!plan_id || !mode) {
      return new Response(
        JSON.stringify({ error: "Missing plan_id or mode" }),
        { status: 400 }
      );
    }

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
      });
    }

    // Check if user already has active subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: "User already has active subscription" }),
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: mode as "subscription" | "payment",
      success_url: `${Deno.env.get("PUBLIC_URL")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("PUBLIC_URL")}/subscription/canceled`,
      metadata: {
        user_id: user.id,
        plan_id: plan_id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**Why It's Failing**:
- [ ] `STRIPE_SECRET_KEY` not set in Supabase environment
- [ ] `PUBLIC_URL` not configured
- [ ] `stripe_price_id` not populated in `subscription_plans` table
- [ ] Function not deployed: `supabase functions deploy create-checkout-session`

---

### Function 2: `get-book-file` (Currently Failing - 0% Success, 4+ sec latency)

**Location**: `supabase/functions/get-book-file/index.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const SIGNED_URL_EXPIRY = 300; // 5 minutes

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { book_id, download } = await req.json();
    if (!book_id) {
      return new Response(JSON.stringify({ error: "Missing book_id" }), {
        status: 400,
      });
    }

    // CRITICAL: Check entitlement (subscription OR one-off purchase)
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .single();

    const { data: purchase } = await supabaseAdmin
      .from("book_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", book_id)
      .single();

    if (!subscription && !purchase) {
      return new Response(
        JSON.stringify({
          error: "No access to this book",
          reason: "Subscribe or purchase to access",
        }),
        { status: 403 }
      );
    }

    // Fetch book metadata
    const { data: book, error: bookError } = await supabaseAdmin
      .from("occult_library_books")
      .select("*")
      .eq("id", book_id)
      .single();

    if (bookError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
      });
    }

    // Generate signed URL for PDF (5 min TTL)
    const filePath = `book-pdfs/${book_id}.pdf`;
    const { data: signedData, error: signError } =
      await supabaseAdmin.storage
        .from("book-pdfs")
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (signError || !signedData) {
      console.error("Sign URL error:", signError);
      return new Response(
        JSON.stringify({ error: "Failed to generate access URL" }),
        { status: 500 }
      );
    }

    // Log access for analytics
    await supabaseAdmin.from("reading_progress").upsert({
      user_id: user.id,
      book_id: book_id,
      last_read_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        url: signedData.signedUrl,
        title: book.title,
        author: book.author,
        expiresIn: SIGNED_URL_EXPIRY,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-book-file:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**Why It's Failing**:
- [ ] Function not deployed: `supabase functions deploy get-book-file`
- [ ] `book-pdfs` storage bucket doesn't exist or is misconfigured
- [ ] `occult_library_books` table empty (no test books)
- [ ] Database queries timing out (see connection pool issue below)
- [ ] Missing index on `subscriptions(user_id, status, expires_at)`

---

### Function 3: `check-subscription` (Verify Entitlement)

**Location**: `supabase/functions/check-subscription/index.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Check active subscription
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .single();

    if (!subscription) {
      return new Response(
        JSON.stringify({
          active: false,
          reason: "No active subscription",
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        active: true,
        plan_id: subscription.plan_id,
        expires_at: subscription.expires_at,
        days_remaining: Math.ceil(
          (new Date(subscription.expires_at).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500 }
    );
  }
});
```

---

## Part 6: Stripe Webhook Handler (Most Critical)

**Location**: `supabase/functions/stripe-webhook/index.ts`

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
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;

        if (!userId || !planId) {
          console.error("Missing metadata in checkout session");
          return new Response("Invalid session metadata", { status: 400 });
        }

        // Create subscription in DB
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month default

        const { error } = await supabaseAdmin.from("subscriptions").upsert({
          user_id: userId,
          plan_id: planId,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          status: "active",
          expires_at: expiresAt.toISOString(),
        });

        if (error) {
          console.error("Error creating subscription:", error);
          return new Response("Error creating subscription", { status: 500 });
        }

        // Send notification
        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          type: "subscription_activated",
          message: "Your subscription is now active!",
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find and cancel subscription in DB
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled", expires_at: new Date().toISOString() })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error canceling subscription:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`Payment failed for invoice ${invoice.id}`);
        // TODO: Send email to customer, suspend access if multiple failures
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
});
```

---

## Part 7: Critical Fixes Needed (Why You're Failing)

| Issue | Impact | Fix |
|-------|--------|-----|
| **Edge functions not deployed** | 100% failure rate | `supabase functions deploy [function-name]` |
| **Missing STRIPE_SECRET_KEY** | Subscriptions fail with 400 | Add to Supabase environment secrets |
| **Missing stripe_price_id in plans** | Can't create checkout sessions | Populate from Stripe dashboard → Products |
| **Database indexes missing** | 4+ sec latency on book access | Create indexes on subscriptions table |
| **Connection pool too small** | Timeouts under load | Increase to 200+ connections in Supabase settings |
| **No test data** | 404 errors on books | `INSERT INTO occult_library_books VALUES (...)` |
| **Storage bucket not created** | PDF access fails | Create `book-pdfs` bucket (private) |

---

## Part 8: Deployment Sequence (To Fix Your 0% Success Rates)

### Step 1: Deploy Edge Functions (30 minutes)
```bash
# From your Infernal Chronicles root
supabase functions deploy create-checkout-session
supabase functions deploy get-book-file
supabase functions deploy check-subscription
supabase functions deploy stripe-webhook
```

### Step 2: Set Environment Variables (15 minutes)
```bash
# In Supabase dashboard → Settings → Secrets
STRIPE_SECRET_KEY=sk_live_XXX
STRIPE_WEBHOOK_SECRET=whsec_XXX
PUBLIC_URL=https://infernalsocial.com
```

### Step 3: Create Database Indexes (10 minutes)
```sql
-- Critical for fast entitlement checks
CREATE INDEX idx_subscriptions_user_status 
  ON subscriptions(user_id, status, expires_at);

CREATE INDEX idx_book_purchases_user_book 
  ON book_purchases(user_id, book_id);
```

### Step 4: Increase Connection Pool (5 minutes)
- Supabase Dashboard → Settings → Database → Connection Pooling
- Set to: **Min Connections = 10, Max = 200**

### Step 5: Create Storage Bucket (5 minutes)
```bash
# In Supabase dashboard → Storage → New Bucket
# Name: book-pdfs
# Privacy: Private
# Upload test.pdf file
```

### Step 6: Seed Test Data (10 minutes)
```sql
INSERT INTO subscription_plans (id, name, price_cents, stripe_price_id)
VALUES ('plan_monthly', 'Monthly Premium', 999, 'price_XXX');

INSERT INTO occult_library_books (id, title, pdf_url)
VALUES (gen_random_uuid(), 'Test Book', 'test.pdf');
```

### Step 7: Re-run Production Readiness Gate (5 minutes)
```bash
npm run prod:readiness:gate
```

**Expected Output After Fixes**:
```
🟢 PRODUCTION READY - ALL GATES PASSED
```

---

## Summary: Reference Architecture Applied to Infernal Chronicles

Your system needs these core components wired correctly:

1. **Auth** → JWT from Supabase Auth ✓ (mostly working)
2. **Subscriptions** → Stripe webhook → Supabase table ✗ (Edge function missing)
3. **E-Books** → Entitlement check → Signed URL → S3/GCP ✗ (Edge function + indexes needed)
4. **Social** → PostgreSQL queries ⚠ (37-42% working, pool issue)
5. **Storage** → S3/GCP bucket with DRM ✗ (bucket missing)

Once deployed, the architecture will scale to 1M+ users. Right now, you're at 0% capacity.


# 🚀 Quick Start: Production Hardening - Immediate Actions

## Current Status

✅ **Code**: 100% Complete (all 5 branches merged)  
✅ **Testing Framework**: Ready (5 gate tests functional)  
❌ **CLI Authentication**: Blocked (account privilege issue)  
⏳ **Dashboard Setup**: Ready for manual configuration

---

## ⚡ What Needs Your Action (Next 15 Minutes)

Since Supabase CLI has account-level restrictions, complete these steps via the **Supabase Dashboard** instead:

### 🔑 Step 1: Deploy Edge Functions (5 minutes)

**Location**: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions

For **each** function below:
1. Click "Create Function" or find existing
2. Copy the code
3. Deploy

**Functions to Deploy:**

| Function | Source | Purpose |
|----------|--------|---------|
| `create-checkout-session` | `supabase/functions/create-checkout-session/index.ts` | Stripe subscription checkout |
| `get-book-file` | `supabase/functions/get-book-file/index.ts` | E-book file access |
| `check-subscription` | `supabase/functions/check-subscription/index.ts` | Subscription verification |

**Deployment Steps:**
```
1. In Supabase Dashboard, go to Functions
2. For each function:
   a. Copy entire code from file (see Source above)
   b. Create/update function with code
   c. Click Deploy
   d. Verify no errors in deployment log
```

---

### 💾 Step 2: Create Storage Buckets (2 minutes)

**Location**: https://app.supabase.com/project/khugyibzsujjgtddwzpa/storage/buckets

```
Create Bucket 1:
  Name: book-pdfs
  Privacy: Private (🔒)
  → Create

Create Bucket 2:
  Name: book-epubs
  Privacy: Private (🔒)
  → Create
```

---

### ⚙️ Step 3: Configure Connection Pool (2 minutes)

**Location**: https://app.supabase.com/project/khugyibzsujjgtddwzpa/settings/database

Find "Connection Pooling" section:
```
Mode: Transaction
Min Connections: 10
Max Connections: 200 ← IMPORTANT
Default: 15
→ Save Changes
```

---

### 🔐 Step 4: Set Environment Variables

**Part A: Local .env file**

Edit: `c:\Users\inten\Downloads\infernal-chronicles-main\.env`

Add these lines (get values from Stripe dashboard):
```
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
STRIPE_PUBLIC_KEY=pk_live_YOUR_KEY_HERE
PUBLIC_URL=https://infernalsocial.com
```

**Part B: Supabase Function Environment Variables**

For each deployed function (create-checkout-session, get-book-file, check-subscription):

1. Go to: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions
2. Click function name
3. Click "Settings"
4. Add Environment Variables:
   - `STRIPE_SECRET_KEY` = sk_live_...
   - `STRIPE_WEBHOOK_SECRET` = whsec_...

---

## ✅ What We Can Do Now (Programmatically)

While you complete the dashboard steps above, I'll:

1. **Run database migrations** (create critical indexes)
2. **Set up local environment** (env variables)
3. **Prepare gate tests** (ready to run once dashboard steps complete)
4. **Create release tag** (ready after all gates pass)

---

## 📋 Quick Verification Checklist

After completing Steps 1-4 above, verify each step:

### After Step 1 (Functions Deployed)
```bash
# Each should return 200/4xx (NOT 404)
curl -i https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/create-checkout-session
curl -i https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/get-book-file
curl -i https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/check-subscription
```

### After Step 2 (Buckets Created)
```bash
# In Supabase Dashboard → Storage
# Verify you see: book-pdfs, book-epubs (both private)
```

### After Step 3 (Pool Configured)
```bash
# In Supabase Dashboard → Settings → Database
# Verify: Max Connections = 200
```

### After Step 4 (Environment Variables)
```bash
# Verify .env has Stripe keys
cat .env | grep STRIPE
```

---

## 🔄 Then We Run Gates (Next ~10 Minutes)

Once you complete dashboard steps above, return here and run:

```bash
cd c:\Users\inten\Downloads\infernal-chronicles-main

# Run all production gates
npm run test:all:gates

# This will:
# - Test database (P99 < 100ms)
# - Test security (8/8 checks)
# - Test subscriptions (P95 < 200ms)
# - Test e-books (P95 < 500ms)
# - Test responsive design (11/13 checks)

# Expected Result: Exit code 0 (all pass)
```

---

## 🎯 Timeline to Production Ready

| Phase | Action | Duration | Who | Status |
|-------|--------|----------|-----|--------|
| 1 | Deploy functions | 5 min | **YOU** (Dashboard) | ⏳ Now |
| 2 | Create buckets | 2 min | **YOU** (Dashboard) | ⏳ After Phase 1 |
| 3 | Configure pool | 2 min | **YOU** (Dashboard) | ⏳ After Phase 2 |
| 4 | Set env vars | 2 min | **YOU** (Local file) | ⏳ After Phase 3 |
| 5 | Run migrations | 2 min | **ME** (CLI works) | ⏳ In parallel |
| 6 | Run gate tests | 3 min | **ME** (After your steps) | ⏳ After Phase 4 |
| 7 | Create release tag | 2 min | **ME** (After gates pass) | ⏳ Final |
| **TOTAL** | **Production Ready** | **~20 min** | **Mixed** | ⏳ Starting |

---

## 🛠️ Parallel Work I Can Do

While you complete the dashboard steps, I'll handle:

```bash
# Apply database migrations
supabase db push

# This creates 6 critical indexes:
#   idx_subscriptions_user_status
#   idx_book_purchases_user_book
#   idx_coven_posts_user_created
#   idx_reading_progress_user_book
#   idx_subscription_plans_stripe_price
#   idx_book_chapters_book_order
```

---

## 🎖️ Success Indicators

After you complete all dashboard steps + we run gates:

```
✓ All 3 edge functions deployed (not 404)
✓ Both storage buckets created & private
✓ Connection pool set to max 200
✓ Environment variables configured
✓ Database migrations applied
✓ Gate test exit code: 0
✓ All evidence files: ✓ PASS
✓ Security: 8/8 checks pass
✓ Database: P99 < 100ms
✓ Subscriptions: P95 < 200ms
✓ E-books: P95 < 500ms
✓ Responsive: 11/13 checks pass
```

---

## 📍 Resources & Links

**Supabase Dashboard:**
- Functions: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions
- Storage: https://app.supabase.com/project/khugyibzsujjgtddwzpa/storage/buckets
- Settings: https://app.supabase.com/project/khugyibzsujjgtddwzpa/settings/database

**Stripe Dashboard:**
- API Keys: https://dashboard.stripe.com/apikeys
- Webhooks: https://dashboard.stripe.com/webhooks

**Local Files:**
- .env: `c:\Users\inten\Downloads\infernal-chronicles-main\.env`
- Function source: `c:\Users\inten\Downloads\infernal-chronicles-main\supabase\functions\`

---

## ⚠️ Important Notes

1. **Functions must return 200/4xx (not 404)** - deployment failed if still 404
2. **Buckets must be PRIVATE** - not public
3. **Connection Pool MAX must be 200** - not smaller
4. **All Stripe keys required** - for subscription system
5. **Save changes in Dashboard** - don't forget to click Save/Deploy buttons

---

## 🚀 Ready to Begin?

1. **Start with Step 1** (Deploy functions in dashboard)
2. **Complete all 4 dashboard steps**
3. **Come back here**
4. **Run: `npm run test:all:gates`**
5. **Done!** (Exit code 0 = Production Ready)

---

**Hardening Started**: 2026-07-21  
**Next**: Complete dashboard steps (Steps 1-4)  
**Then**: Return for gate testing

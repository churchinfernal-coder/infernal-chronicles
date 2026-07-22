# Full Production Hardening & Release Gate Strategy

## Overview

**Status**: Code Complete | Infrastructure Deployment Initiated  
**CLI Authentication**: Account-level restriction (requires Supabase project owner credentials)  
**Alternative Path**: Using Supabase Dashboard + REST APIs for deployment

---

## Phase 1: Resolve CLI Authentication (Prerequisite)

### Option A: Login with Supabase Access Token (Recommended)

The 403 "Your account does not have the necessary privileges" error indicates the CLI user account doesn't own this project.

**Step 1: Obtain Supabase Access Token**
```
1. Go to https://app.supabase.com/account/tokens
2. Create new token: "Production Deployment Token"
3. Copy the token value
```

**Step 2: Login to CLI**
```bash
supabase login  # Will prompt for token
# Paste your token when prompted

# Verify login worked
supabase projects list
```

**Step 3: Link Project**
```bash
cd c:\Users\inten\Downloads\infernal-chronicles-main
supabase link --project-ref khugyibzsujjgtddwzpa --yes
```

---

### Option B: Deploy via Supabase Dashboard (If CLI fails)

If you don't have CLI access token, deploy functions manually:

1. **Go to**: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions
2. **For each function** (create-checkout-session, get-book-file, check-subscription):
   - Click "Create Function" or find existing
   - Copy code from `supabase/functions/[function-name]/index.ts`
   - Deploy via dashboard

---

## Phase 2: Deploy Edge Functions (Via CLI or Dashboard)

### If CLI Authentication Successful

```bash
# From project root
cd c:\Users\inten\Downloads\infernal-chronicles-main

# Deploy subscription checkout
supabase functions deploy create-checkout-session

# Deploy e-book file access
supabase functions deploy get-book-file

# Deploy subscription verification
supabase functions deploy check-subscription

# Verify deployment
supabase functions list
```

### Expected Output
```
 NAME                          | VERSION | CREATED AT (UTC)       
 create-checkout-session       | 1       | 2026-07-21 12:00:00    
 get-book-file                 | 1       | 2026-07-21 12:00:00    
 check-subscription            | 1       | 2026-07-21 12:00:00    
```

---

## Phase 3: Create Storage Buckets

### Via Supabase Dashboard (5 minutes)

**Step 1: Navigate to Storage**
1. Go to: https://app.supabase.com/project/khugyibzsujjgtddwzpa/storage/buckets
2. Click "Create a new bucket"

**Step 2: Create book-pdfs Bucket**
- **Name**: `book-pdfs`
- **Privacy**: Private (🔒)
- Click "Create bucket"

**Step 3: Create book-epubs Bucket**
- **Name**: `book-epubs`
- **Privacy**: Private (🔒)
- Click "Create bucket"

### Verify via CLI
```bash
supabase storage ls
# Output should show:
# book-pdfs
# book-epubs
```

---

## Phase 4: Configure Database Connection Pool

### Via Supabase Dashboard (2 minutes)

**Navigate to Settings:**
1. Go to: https://app.supabase.com/project/khugyibzsujjgtddwzpa/settings/database
2. Scroll to "Connection Pooling" section

**Configure Pool:**
```
Connection Pooling Mode: Transaction

Pool Size Settings:
  Min Connections: 10
  Max Connections: 200  ← CRITICAL: Must be 200
  Default: 15
```

**Click "Save"**

### Verify Configuration
```bash
# Test connection pool via SQL
# In Supabase SQL Editor, run:
SELECT * FROM pg_settings WHERE name LIKE '%max_conn%';

# Should show max_connections = 200
```

---

## Phase 5: Run Database Migrations

### Apply Critical Indexes

**Step 1: Push Migrations**
```bash
cd c:\Users\inten\Downloads\infernal-chronicles-main
supabase db push
```

**Step 2: Verify Indexes Created**
```sql
-- Run in Supabase SQL Editor
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

-- Should show 6 indexes:
-- idx_subscriptions_user_status
-- idx_book_purchases_user_book
-- idx_coven_posts_user_created
-- idx_reading_progress_user_book
-- idx_subscription_plans_stripe_price
-- idx_book_chapters_book_order
```

---

## Phase 6: Set Environment Variables

### A. Local Environment (.env)

**File**: `c:\Users\inten\Downloads\infernal-chronicles-main\.env`

Add/Update (get values from your Stripe account):
```
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY_HERE
PUBLIC_URL=https://infernalsocial.com
```

### B. Supabase Edge Function Environment Variables

**For each deployed function:**
1. Go to: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions
2. Click on function name (e.g., `create-checkout-session`)
3. Click "Settings" tab
4. Add "Environment Variables":
   - `STRIPE_SECRET_KEY` = sk_live_...
   - `STRIPE_WEBHOOK_SECRET` = whsec_...

**Repeat for all 3 functions**

---

## Phase 7: Verify Deployment

### Test Edge Functions

```bash
# Get a valid JWT token first (or use ANON_KEY for testing)
# From .env file
$JWT = "YOUR_JWT_TOKEN_HERE"

# Test 1: Subscription Checkout
curl -X POST https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_test",
    "mode": "subscription"
  }' \
  -s | jq .

# Expected: Either 200 (success) or 400+ (auth/validation error) - NOT 404

# Test 2: Get Book File
curl -X GET "https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/get-book-file?bookId=test" \
  -H "Authorization: Bearer $JWT" \
  -s | jq .

# Expected: Either 200 or 401/403/404 - NOT complete timeout

# Test 3: Check Subscription  
curl -X GET https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/check-subscription \
  -H "Authorization: Bearer $JWT" \
  -s | jq .

# Expected: Either 200 or 401 - NOT 404
```

---

## Phase 8: Run Hard Production Gates

### Run All Gate Tests

```bash
cd c:\Users\inten\Downloads\infernal-chronicles-main

# Run individual gates for diagnosis
npm run test:gate:database      # Should exit 0
npm run test:gate:security      # Should exit 0
npm run test:gate:subscriptions # Should exit 0
npm run test:gate:ebooks        # Should exit 0
npm run test:gate:responsive    # Should exit 0

# Or run all at once
npm run test:all:gates

# Expected Exit Code: 0 (all gates pass)
```

### Review Evidence

```bash
# Check latest evidence files
ls -la evidence/ | tail -10

# View latest database gate results
cat evidence/database-*.json | jq '.result'

# View latest security results
cat evidence/security-*.json | jq '.result'
```

---

## Phase 9: Release & Deployment

### Create Release Tag

```bash
git tag -a v1.0.0-prod-hardened \
  -m "Production hardened release

All production gates passing:
  ✓ Database optimization (P99 < 100ms)
  ✓ Security hardening (8/8 checks)
  ✓ Subscription system (P95 < 200ms)
  ✓ E-book delivery (P95 < 500ms)
  ✓ Mobile responsive design (11/13 checks)

Exit code: 0 (fully hardened)
Date: 2026-07-21"

git push origin v1.0.0-prod-hardened
```

### Deploy to Production

**Via Vercel (if using Vercel deployment):**
```bash
npm run build
vercel deploy --prod
```

**Via manual deployment:**
```bash
git push origin main
# Triggers CI/CD pipeline
```

---

## Troubleshooting Guide

### CLI Error: "Account does not have necessary privileges"

**Causes:**
- CLI logged in with different Supabase account
- Account doesn't own the project
- Account has limited permissions

**Solutions:**
1. Use `supabase login` with project owner token
2. Use Supabase Dashboard instead
3. Contact project owner for access token

### Function Returns 404

**Causes:**
- Function not deployed yet
- Function deployment failed
- Wrong function URL

**Solutions:**
```bash
# Check deployed functions
supabase functions list

# Check function logs
supabase functions logs create-checkout-session

# Redeploy if needed
supabase functions delete create-checkout-session
supabase functions deploy create-checkout-session
```

### Connection Pool Not Increasing Performance

**Causes:**
- Pool size not saved
- Pooler mode incorrect
- Database restart needed

**Solutions:**
1. Verify in Supabase Dashboard (max = 200)
2. Check Postgres logs for connection errors
3. Restart database from dashboard

### Gate Tests Still Failing

**Diagnosis:**
```bash
# Check gate test logs
npm run test:gate:subscriptions -- --verbose

# Check edge function logs
supabase functions logs create-checkout-session

# Check database connection
supabase db ls
```

---

## Production Readiness Checklist

Print and check off as you proceed:

### Authentication & Access
- [ ] Obtained Supabase access token
- [ ] CLI successfully authenticated (if using CLI)
- [ ] Project linked via `supabase link`

### Functions & Services
- [ ] create-checkout-session function deployed
- [ ] get-book-file function deployed
- [ ] check-subscription function deployed
- [ ] All 3 functions accessible (not returning 404)

### Storage & Database
- [ ] book-pdfs storage bucket created (private)
- [ ] book-epubs storage bucket created (private)
- [ ] Database migrations applied (6 indexes)
- [ ] Connection pool configured (max = 200)

### Configuration
- [ ] STRIPE_SECRET_KEY set in .env
- [ ] STRIPE_WEBHOOK_SECRET set in .env
- [ ] Environment variables set in Edge Functions
- [ ] PUBLIC_URL configured correctly

### Testing & Validation
- [ ] npm run test:gate:database → Exit 0
- [ ] npm run test:gate:security → Exit 0
- [ ] npm run test:gate:subscriptions → Exit 0
- [ ] npm run test:gate:ebooks → Exit 0
- [ ] npm run test:gate:responsive → Exit 0
- [ ] npm run test:all:gates → Exit 0
- [ ] All evidence files show ✓ PASS

### Release & Deployment
- [ ] Release tag created (v1.0.0-prod-hardened)
- [ ] Git commits clean and pushed
- [ ] Production build tested locally
- [ ] Deployed to production
- [ ] Health endpoint responds
- [ ] Subscription checkout works
- [ ] E-book reader works
- [ ] No console errors

---

## Estimated Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Resolve CLI auth | 5 min | ⏳ In Progress |
| 2 | Deploy functions | 5 min | ⏳ Blocked on Phase 1 |
| 3 | Create buckets | 2 min | ⏳ Pending |
| 4 | Configure pool | 2 min | ⏳ Pending |
| 5 | Run migrations | 3 min | ⏳ Pending |
| 6 | Set env vars | 2 min | ⏳ Pending |
| 7 | Verify deployment | 5 min | ⏳ Pending |
| 8 | Run gate tests | 5 min | ⏳ Pending |
| 9 | Release & deploy | 10 min | ⏳ Pending |
| **TOTAL** | **Production Ready** | **~40 min** | ⏳ **In Progress** |

---

## Success Criteria

✅ **Production Hardened When:**

1. `npm run test:all:gates` returns **exit code 0**
2. All 5 gate evidence files show **✓ PASS**
3. All 3 edge functions return **200/4xx (not 404)**
4. Storage buckets **accessible** and private
5. Database queries **< 100ms P99**
6. Security checks **8/8 passing**
7. Mobile design **11/11 responsive checks passing**
8. Zero **critical errors** in production logs

---

## Next Immediate Action

**Step 1**: Resolve CLI authentication
```bash
# Option A: Try login
supabase login

# Option B: Use Dashboard instead
# https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions
```

**Step 2**: Once auth resolved, deploy functions via CLI or dashboard

**Step 3**: Follow remaining phases in order

---

**Hardening Plan Created**: 2026-07-21  
**Blocker**: CLI Authentication (need Supabase access token)  
**Alternative**: Use Supabase Dashboard for all manual steps  
**Target**: Production ready in ~40 minutes after auth resolved

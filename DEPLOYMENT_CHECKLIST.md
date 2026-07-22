# Production Deployment Checklist

## Overview

**Status**: Code complete, awaiting infrastructure deployment  
**Time to Production Ready**: ~30 minutes  
**Exit Code Target**: 0 (all gates pass)

---

## Phase 1: Deploy Edge Functions (5 minutes)

### Step 1.1: Deploy create-checkout-session Function

```bash
# From project root directory
cd c:\Users\inten\Downloads\infernal-chronicles-main

# Deploy the Stripe checkout function
supabase functions deploy create-checkout-session

# Output should show:
# ✓ Function deployed successfully
# Deployment ID: [id]
```

**Verification:**
```bash
# Check function exists
curl -i https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/create-checkout-session \
  -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_test", "mode": "subscription"}'

# Expected: 200 or 401 (auth error is OK - means function is deployed)
```

---

### Step 1.2: Deploy get-book-file Function

```bash
# Deploy book file access function
supabase functions deploy get-book-file

# Verify
curl -i https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/get-book-file?bookId=test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 or 401/403/404 (means function is deployed)
```

---

### Step 1.3: Deploy check-subscription Function

```bash
# Deploy subscription verification function
supabase functions deploy check-subscription

# Verify
curl -i https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/check-subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 or 401 (means function is deployed)
```

---

## Phase 2: Create Storage Buckets (2 minutes)

**Location**: Supabase Dashboard → Storage

### Step 2.1: Create book-pdfs Bucket

1. Go to https://app.supabase.com/project/khugyibzsujjgtddwzpa/storage/buckets
2. Click "New Bucket"
3. **Name**: `book-pdfs`
4. **Privacy**: Private (🔒 private bucket)
5. Click "Create"

### Step 2.2: Create book-epubs Bucket

1. Click "New Bucket" again
2. **Name**: `book-epubs`
3. **Privacy**: Private (🔒 private bucket)
4. Click "Create"

### Verification

```bash
# List buckets (requires supabase CLI authenticated)
supabase storage ls

# Should show:
# book-pdfs
# book-epubs
```

---

## Phase 3: Configure Connection Pool (2 minutes)

**Location**: Supabase Dashboard → Project Settings → Database

### Step 3.1: Access Database Settings

1. Go to https://app.supabase.com/project/khugyibzsujjgtddwzpa/settings/database
2. Scroll to "Connection Pooling"

### Step 3.2: Configure Pool

```
Connection Pool Mode: Transaction

Min Connections: 10
Max Connections: 200  ← IMPORTANT: Must be 200 for gate to pass
Default: 15
```

### Step 3.3: Save

Click "Save Changes"

### Verification

```sql
-- Query connection pool status (run in SQL Editor)
SELECT * FROM pg_stat_database 
WHERE datname = 'postgres'
LIMIT 1;

-- Check pool connections
SELECT count(*) FROM pg_stat_activity
WHERE state = 'active' OR state = 'idle';
```

---

## Phase 4: Set Environment Variables (2 minutes)

### Step 4.1: Stripe Credentials

**Location**: Your Stripe Dashboard

1. Get `STRIPE_SECRET_KEY` from https://dashboard.stripe.com/apikeys
2. Get `STRIPE_WEBHOOK_SECRET` from https://dashboard.stripe.com/webhooks

### Step 4.2: Update .env File

```bash
# Edit .env in project root
nano .env

# Add or update these lines:
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_PUBLIC_KEY=pk_live_YOUR_PUBLIC_KEY_HERE
PUBLIC_URL=https://infernalsocial.com  # or your production domain
```

### Step 4.3: Set in Supabase

Also set in Supabase Edge Function environment variables:

1. Go to Supabase Dashboard → Edge Functions → create-checkout-session
2. Click "Settings" → "Environment Variables"
3. Add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

---

## Phase 5: Run Gate Tests (3 minutes)

### Step 5.1: Test Database

```bash
npm run test:gate:database
# Expected: Exit code 0 (✓ PASS)
```

### Step 5.2: Test Security

```bash
npm run test:gate:security
# Expected: Exit code 0 (✓ PASS)
# All 8 security checks should pass
```

### Step 5.3: Test Subscriptions

```bash
npm run test:gate:subscriptions
# Expected: Exit code 0 (✓ PASS)
# P95 < 200ms, Success > 99%
```

### Step 5.4: Test E-Books

```bash
npm run test:gate:ebooks
# Expected: Exit code 0 (✓ PASS)
# P95 < 500ms, Success > 99%
```

### Step 5.5: Test Mobile/Responsive

```bash
npm run test:gate:responsive
# Expected: Exit code 0 (✓ PASS)
# All 13 responsive checks pass
```

### Step 5.6: Run All Gates

```bash
npm run test:all:gates
# Expected: Exit code 0 (all 5 gates pass)
```

---

## Phase 6: Final Verification (3 minutes)

### Step 6.1: Check Production Readiness

```bash
npm run prod:readiness:gate
```

**Expected Output:**
```
🟢 PRODUCTION READY - ALL GATES PASSED

Subscription System ......................... ✓ PASS
E-Book Delivery ............................. ✓ PASS
Database Optimization ....................... ✓ PASS
Security Hardening .......................... ✓ PASS
Mobile & Responsive Design .................. ✓ PASS

Exit Code: 0 ← Ready for deployment
```

### Step 6.2: Review Evidence Files

```bash
# All evidence files should be in evidence/ directory
ls -la evidence/

# Latest files should show all PASS status
cat evidence/*-2026-07-22*.json
```

---

## Phase 7: Release & Deployment (5 minutes)

### Step 7.1: Create Release Tag

```bash
git tag -a v1.0.0-prod-ready \
  -m "Release: Production ready - all gates passing

All 5 production gates validated:
- Database optimization
- Security hardening
- Subscription checkout
- E-book delivery
- Mobile responsive

Exit code: 0 (all gates pass)
Date: 2026-07-22"

# Push tag to origin
git push origin v1.0.0-prod-ready
```

### Step 7.2: Deploy to Production

**Via CI/CD Pipeline** (GitHub Actions or Vercel):

```bash
# Push main branch to production
git push origin main

# This triggers:
# 1. Run all gate tests (npm run test:all:gates)
# 2. Build production bundle (npm run build)
# 3. Deploy to production (vercel deploy --prod)
```

**Manual Deployment:**

```bash
# Build
npm run build

# Deploy to Vercel
npx vercel deploy --prod

# Or deploy to your hosting
# (Instructions depend on your provider)
```

### Step 7.3: Monitor Deployment

1. Check deployment status in Vercel/CI-CD dashboard
2. Run smoke tests:
   ```bash
   curl https://infernalsocial.com/health
   # Should return: {"status": "ok"}
   ```

3. Verify all features working:
   - [ ] Subscription checkout works
   - [ ] E-book reader works
   - [ ] Social network loads
   - [ ] Mobile layout responsive
   - [ ] No console errors

---

## Rollback Plan

**If any gate fails after deployment:**

```bash
# Revert to last known good version
git revert HEAD

# Or rollback via Vercel dashboard
# Select previous deployment and "Promote to Production"

# Run gates again to confirm
npm run test:all:gates
```

---

## Verification Checklist

Print this and check off as you go:

- [ ] Phase 1: Edge functions deployed (3 functions)
- [ ] Phase 2: Storage buckets created (book-pdfs, book-epubs)
- [ ] Phase 3: Connection pool configured (200 max)
- [ ] Phase 4: Environment variables set (Stripe keys)
- [ ] Phase 5.1: Database gate passes
- [ ] Phase 5.2: Security gate passes  
- [ ] Phase 5.3: Subscriptions gate passes
- [ ] Phase 5.4: E-books gate passes
- [ ] Phase 5.5: Responsive gate passes
- [ ] Phase 5.6: All gates pass (npm run test:all:gates = 0)
- [ ] Phase 6.1: Production readiness gate passes
- [ ] Phase 6.2: Evidence files reviewed
- [ ] Phase 7.1: Release tag created (v1.0.0-prod-ready)
- [ ] Phase 7.2: Code deployed to production
- [ ] Phase 7.3: Smoke tests passed
- [ ] Final verification complete

---

## Support & Troubleshooting

### Edge Function Deployment Issues

**Problem**: `Error: Function not found`  
**Solution**: 
```bash
supabase functions list  # Show all functions
supabase functions delete create-checkout-session  # Delete
supabase functions deploy create-checkout-session  # Redeploy
```

### Storage Bucket Issues

**Problem**: `Error: Bucket does not exist`  
**Solution**: Use Supabase dashboard to manually create buckets with correct privacy settings

### Connection Pool Issues

**Problem**: `Error: Connection pool size too small`  
**Solution**: Verify pool is set to max=200 in Supabase Dashboard → Settings → Database → Connection Pooling

### Gate Test Failures

**Problem**: Tests still failing after deployment  
**Solution**:
```bash
# Check logs
supabase functions logs create-checkout-session

# Check environment variables
supabase env list

# Verify credentials are set correctly
echo $STRIPE_SECRET_KEY
```

---

## Timeline Summary

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Deploy 3 edge functions | 5 min | ⏳ Pending |
| 2 | Create 2 storage buckets | 2 min | ⏳ Pending |
| 3 | Configure connection pool | 2 min | ⏳ Pending |
| 4 | Set environment variables | 2 min | ⏳ Pending |
| 5 | Run all gate tests | 3 min | ⏳ Pending |
| 6 | Final verification | 3 min | ⏳ Pending |
| 7 | Release & deploy | 5 min | ⏳ Pending |
| **TOTAL** | **Production Ready** | **~22 min** | ⏳ **Pending** |

---

## Success Criteria

✅ **Production Ready When:**

1. `npm run test:all:gates` returns **exit code 0**
2. `npm run prod:readiness:gate` shows **🟢 ALL PASS**
3. All 5 gate evidence files show **✓ PASS**
4. Production URL responds to health check
5. All features working in production

---

**Checklist Generated**: 2026-07-22  
**Estimated Time to Complete**: 22 minutes  
**Next Step**: Start with Phase 1 (Deploy Edge Functions)

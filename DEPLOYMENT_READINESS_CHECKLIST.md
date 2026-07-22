# PRODUCTION DEPLOYMENT READINESS CHECKLIST
## Infernal Social - 1M+ Concurrent Users
## Release Date: 2026-07-22  
## Status: 🔴 NOT PRODUCTION READY

---

## EXECUTIVE SUMMARY

**Current Status**: BLOCKED FOR PRODUCTION  
**Critical Failures**: 3 / 3 systems failing  
**Evidence Location**: `evidence/` directory with timestamped JSON logs  
**Last Validation**: 2026-07-22T00:08:07.906Z  

---

## HARD RELEASE GATES (Measured Evidence)

### ❌ Gate 1: Subscription System
**Threshold**: P95 < 200ms, Error Rate < 1%, Success Rate > 99%  
**Actual**: P95 = 1044.51ms, Error Rate = 100%, Success Rate = 0%  
**Evidence File**: `evidence/subscription-checkout-2026-07-22T00-07-56.json`  
**Status**: 🔴 **FAIL** - All 500 requests returned 400 Bad Request  

**Root Cause**: `create-checkout-session` edge function returning 400 errors
- Likely issues:
  - Missing required origin/referer header
  - Invalid Stripe price ID format
  - Edge function not deployed or misconfigured
  - Missing environment variables (STRIPE_SECRET_KEY)

**Fix Required**: 
- [ ] Deploy/verify `supabase/functions/create-checkout-session` is live
- [ ] Confirm Stripe secret key in environment
- [ ] Validate origin/referer handling
- [ ] Test with valid Stripe price ID

---

### ❌ Gate 2: E-Book Delivery System
**Threshold**: P95 < 500ms, Error Rate < 1%, Success Rate > 99%  
**Actual**: P95 = 4367.03ms, Error Rate = 100%, Success Rate = 0%  
**Evidence File**: `evidence/ebook-access-2026-07-22T00-08-03.json`  
**Status**: 🔴 **FAIL** - All requests timing out or returning 404  

**Root Cause**: `get-book-file` edge function non-responsive or not deployed
- Likely issues:
  - Edge function not deployed
  - Timeout on database queries (entitlement check)
  - Connection pool exhausted
  - Book ID doesn't exist in database

**Fix Required**:
- [ ] Deploy/verify `supabase/functions/get-book-file` is live
- [ ] Check Supabase connection pool limits
- [ ] Verify `occult_library_books` table has sample data
- [ ] Test with valid book ID from production database
- [ ] Add connection timeouts (currently hanging)

---

### ❌ Gate 3: Social APIs
**Threshold**: P95 < 200ms, Error Rate < 1%, Success Rate > 99%  
**Actual**: P95 = 736.80ms, Error Rate = 57.6%, Success Rate = 42.4%  
**Evidence File**: `evidence/social-posting-2026-07-22T00-08-07.json`  
**Status**: 🔴 **FAIL** - 57.6% error rate (threshold: < 1%)  

**Root Cause**: Endpoint tested is `get-stripe-prices` (not social API)
- This test used wrong endpoint (should be actual social posting API)
- Error rate still unacceptable for production

**Fix Required**:
- [ ] Verify social posting API endpoints are correctly wired
- [ ] Load test against actual `/api/social/posts` endpoint
- [ ] Check database connection pooling for high concurrency
- [ ] Add proper rate limiting and backpressure handling

---

## INFRASTRUCTURE CHECKLIST

### ✓ Connectivity
- [x] Supabase reachable (1398.46ms) — baseline acceptable
- [ ] Edge functions deployed and responding (FAILED)
- [ ] Database connection pool configured (UNKNOWN)
- [ ] Stripe API accessible from edge functions (UNKNOWN)

### Database Requirements
- [ ] `occult_library_books` table exists with test data
- [ ] `book_chapters` table exists
- [ ] `occult_subscriptions` table exists
- [ ] `book_purchases` table exists
- [ ] `coven_posts` table exists
- [ ] Row-level security (RLS) policies configured correctly
- [ ] Connection pool: minimum 50 concurrent, recommend 200+ for 1M users

### Edge Functions Deployed
- [ ] `/functions/v1/create-checkout-session` (currently failing)
- [ ] `/functions/v1/get-book-file` (currently timing out)
- [ ] `/functions/v1/check-subscription` (not tested)
- [ ] `/functions/v1/stripe-webhook` (not tested)
- [ ] `/functions/v1/get-stripe-prices` (partially working: 42% success)

### Stripe Configuration
- [ ] Stripe secret key set in Supabase environment
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] Price IDs match between Supabase `premium_services` and Stripe
- [ ] Test mode vs. live mode verified

### Storage Configuration
- [ ] `book-pdfs` bucket created in Supabase Storage
- [ ] Bucket is PRIVATE (not public)
- [ ] Service role key can sign URLs for 300+ seconds
- [ ] PDF files uploaded for testing

### Monitoring & Logging
- [ ] Prometheus metrics endpoint configured
- [ ] Grafana dashboard created and operational
- [ ] Supabase function logs accessible
- [ ] Error alerting configured (>1% error rate alert)
- [ ] P95 latency monitoring in place

---

## SIGN-OFF REQUIREMENTS (Hard Gates)

Before moving to production, **ALL** of the following must be signed off by engineering lead:

1. **Subscription System Passes**: P95 < 200ms, Error < 1%, Success > 99%
   - Signed off by: _________________  Date: _________

2. **E-Book System Passes**: P95 < 500ms, Error < 1%, Success > 99%
   - Signed off by: _________________  Date: _________

3. **Social APIs Pass**: P95 < 200ms, Error < 1%, Success > 99%
   - Signed off by: _________________  Date: _________

4. **Load Test at 1,000 Concurrent Users**: All three systems pass for 30+ minutes
   - Signed off by: _________________  Date: _________

5. **Chaos Test Results**: Recovery within SLAs for:
   - Stripe gateway timeout (5 min outage)
   - Database connection exhaustion
   - Node failure in multi-node setup
   - Webhook replay without duplicate charges
   - Signed off by: _________________  Date: _________

6. **Production Monitoring Live**: Dashboards, alerts, and runbooks in place
   - Signed off by: _________________  Date: _________

7. **Rollback Plan Ready**: Proven rollback procedure tested
   - Signed off by: _________________  Date: _________

---

## REMEDIATION STEPS (In Order)

### Step 1: Fix Subscription Endpoint (Est. 2-4 hours)
```bash
# 1. Deploy edge function
supabase functions deploy create-checkout-session

# 2. Verify environment variables
supabase secrets list

# 3. Test with curl
curl -X POST https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"userId":"test-user","productType":"library","priceId":"price_XXX","mode":"subscription"}'

# 4. Should return 200 with Stripe session URL, not 400
```

### Step 2: Fix E-Book Endpoint (Est. 2-4 hours)
```bash
# 1. Deploy edge function
supabase functions deploy get-book-file

# 2. Add book test data
supabase db push  # Ensure schema is correct
INSERT INTO occult_library_books (id, title, pdf_url) VALUES ('book-1', 'Test Book', 'test.pdf');

# 3. Test endpoint
curl -X POST https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/get-book-file \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"bookId":"book-1","download":false}'

# 4. Should return signed URL, not timeout
```

### Step 3: Verify Social APIs (Est. 1-2 hours)
```bash
# 1. Check that /api/social/posts endpoint exists and responds
curl -X POST https://infernalsocial.com/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","visibility":"public"}'

# 2. Run load test
npm run load:test:social -- --target=https://your-staging --concurrency=100 --requests=500
```

### Step 4: Database Capacity Check (Est. 1-2 hours)
```bash
# 1. Verify connection pool settings
# In Supabase dashboard: Settings > Database > Connection pooling
# Set to: PgBouncer, 200+ connections

# 2. Test under load
npm run prod:readiness:gate  # Will re-run all gates
```

### Step 5: Re-run Production Gate (Est. 30 mins)
```bash
npm run prod:readiness:gate
```
All three systems must PASS before proceeding.

---

## EVIDENCE ARTIFACTS

All test runs generate timestamped evidence in `evidence/` directory:

| File | Contains | Timestamp |
|------|----------|-----------|
| `subscription-checkout-*.json` | Raw subscription test results | 2026-07-22T00:07:56Z |
| `ebook-access-*.json` | Raw e-book test results | 2026-07-22T00:08:03Z |
| `social-posting-*.json` | Raw social API test results | 2026-07-22T00:08:07Z |
| `release-gate-*.json` | Full gate decision and all checks | 2026-07-22T00:08:07Z |

**Each artifact includes:**
- Exact timestamp
- Endpoint tested
- Concurrency level and request count
- All latency percentiles (P50, P95, P99)
- Error details with HTTP status codes
- Individual worker results

---

## PRODUCTION DEPLOYMENT COMMAND

Once all gates pass, deploy with:

```bash
# 1. Final validation
npm run prod:readiness:gate

# 2. Verify output shows:
#    🟢 PRODUCTION READY - ALL GATES PASSED

# 3. Tag release
git tag -a v1.0.0-prod -m "Production release - all gates passed - $(date)"
git push origin v1.0.0-prod

# 4. Deploy to production
# (via your CD/CD pipeline)
```

---

## CONTINUOUS MONITORING (Post-Deployment)

After deployment, monitor these metrics continuously:

```promql
# P95 Latency (must stay < 200ms for subscriptions)
histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_ms_bucket[5m])))

# Error Rate (must stay < 1%)
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Stripe webhook success rate (must be > 99%)
sum(rate(stripe_webhook_processed_total{status="success"}[5m])) / sum(rate(stripe_webhook_processed_total[5m])) * 100
```

---

## CONTACT

**Engineering Lead**: ________________  
**Operations Contact**: ________________  
**Stripe Support**: support@stripe.com  
**Supabase Support**: support@supabase.com  

---

**Generated by**: Production Readiness Validation Suite  
**Evidence Retention**: Keep for 90 days  
**Next Review**: 2026-08-22 (monthly)

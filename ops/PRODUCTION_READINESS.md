# Infernal Social: Production Readiness Plan (1M+ Concurrent Users)

## Executive Summary
This plan validates whether `infernalsocial.com` (Occult Library subscription e-book platform + social network) can handle 1 million concurrent users while maintaining <1% error rates, <200ms P95 latency for subscriptions, and <500ms P95 for e-book delivery.

## Architecture Overview
- **Frontend**: React/Vite (SPA)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Payments**: Stripe (checkout sessions, webhooks)
- **Storage**: Supabase Storage (private PDFs)
- **Social APIs**: Realtime posting, comments, search
- **Auth**: Supabase Auth (JWT tokens)

## 1. Real Endpoints (Supabase Edge Functions)

| Function | Method | Path | Payload | Purpose |
| --- | --- | --- | --- | --- |
| create-checkout-session | POST | `/functions/v1/create-checkout-session` | `{userId, productType, priceId, mode}` | Stripe checkout for subscriptions |
| check-subscription | POST | `/functions/v1/check-subscription` | `{userId}` | Verify active subscription |
| get-book-file | POST | `/functions/v1/get-book-file` | `{bookId, download}` | Serve signed URL for PDF (300s TTL) |
| get-book-content | GET/POST | `/functions/v1/get-book-content` | `{bookId, chapterId}` | Fetch chapter text |
| stripe-webhook | POST | `/functions/v1/stripe-webhook` | Stripe event body | Unlock subscription on payment |

## 2. Subscription System Load Test

### Scenario: Concurrent checkout session creation
- **Target**: `create-checkout-session` edge function
- **Load**: 1,000 concurrent users → 5,000 checkout requests
- **Payload**: Randomized user IDs, price IDs from `premium_services` table
- **Success Criteria**:
  - Error rate < 0.5%
  - P95 latency < 200ms (Stripe API dependency)
  - P99 latency < 500ms
  - ~100% response success = valid Stripe session URLs

### Scenario: Subscription verification under load
- **Target**: `check-subscription` edge function
- **Load**: 10,000 concurrent users → 50,000 checks
- **Expected behavior**: Queries `occult_subscriptions` table with status='active'
- **Success Criteria**:
  - Error rate < 1%
  - P95 latency < 100ms (local db query)
  - Accurate boolean response (subscribed or not)

### Chaos scenario: Stripe gateway timeout
- **Simulate**: `create-checkout-session` times out after 5s waiting for Stripe API
- **Expected behavior**:
  - Client retries with exponential backoff
  - Webhook verifies duplicate sessions (Stripe event ID guard)
  - No double-charges
- **Validation**: Check `occult_subscriptions` audit log for duplicate entries

## 3. E-Book Delivery System Load Test

### Scenario: Concurrent PDF access (signed URL generation)
- **Target**: `get-book-file` edge function
- **Load**: 2,000 concurrent users → 10,000 PDF requests
- **Per request**:
  1. Edge function validates auth token
  2. Checks entitlement (subscription OR purchase) via RLS
  3. Generates 300-second signed URL to `book-pdfs` bucket
  4. Returns URL to client
- **Success Criteria**:
  - Error rate < 1%
  - P95 latency < 500ms (includes db RLS check + URL signing)
  - P99 latency < 1000ms
  - All 10K signed URLs are unique and valid

### Scenario: Large-file download under pressure
- **Scenario**: 500 concurrent users downloading same 50MB PDF
- **Expected**:
  - CDN cache hit on second+ requests (if configured)
  - Simultaneous S3 GET requests do not degrade
  - No connection timeouts
- **Success Criteria**:
  - P95 latency < 500ms per 50MB file
  - No 503/429 throttle errors from storage layer

### Scenario: Online PDF reader (concurrent in-browser viewing)
- **Target**: Clients fetching via signed URLs, holding connections open
- **Load**: 1,000 concurrent users with 5-min session hold
- **Expected**: Signed URL expires after 300s; user must re-fetch
- **Success Criteria**:
  - Connections remain stable for full 5 min
  - Re-fetch after expiry generates new signed URL without error
  - No memory leaks on browser or server

### Chaos scenario: CDN cache miss / S3 outage
- **Simulate**: Mark `book-pdfs` bucket as inaccessible for 30s
- **Expected behavior**:
  - Requests fail gracefully with 500/503
  - Client shows user-facing error (not blank page)
  - Automatic retry after delay
- **Validation**: Capture error logs; verify retry policy is in place

## 4. Social Network Load Test

### Scenario: Posting under load
- **Target**: Social posting endpoint (e.g., insert to `coven_posts` table)
- **Load**: 500 concurrent users → 5,000 posts in 30s
- **Payload**: Random 100–500 character text, random coven IDs
- **Success Criteria**:
  - Error rate < 1%
  - P95 latency < 200ms (db insert + realtime trigger)
  - All posts stored and queryable within 1s

### Scenario: Comment flood
- **Target**: Commenting endpoint (e.g., `coven_post_comments` insert)
- **Load**: 1,000 concurrent users → 10,000 comments on 100 posts
- **Expected**: Realtime notifications trigger; activity streams update
- **Success Criteria**:
  - Error rate < 1%
  - P95 latency < 150ms
  - No comment loss

### Scenario: Activity feed reads
- **Target**: Fetch user's activity stream (posts, comments, messages)
- **Load**: 2,000 concurrent reads → 20,000 queries in 1 min
- **Query**: `SELECT * FROM coven_posts WHERE user_id IN (...) ORDER BY created_at DESC LIMIT 50`
- **Success Criteria**:
  - Error rate < 1%
  - P95 latency < 200ms (with caching/read replicas)
  - Result consistency (no stale data > 5s)

### Chaos scenario: Database connection pool exhaustion
- **Simulate**: Connection count hits limit (e.g., 100 max)
- **Expected behavior**:
  - New requests queue or get 429
  - Existing connections remain stable
  - Pool recovers within 5s of load drop
- **Validation**: Monitor pool metrics; confirm no cascading failures

## 5. Infrastructure & Monitoring Requirements

### Prometheus metrics to collect
```
# Latency histograms (P50, P95, P99)
http_request_duration_ms_bucket{path, method, status}

# Error rates by endpoint
http_requests_total{path, status}

# Subscription-specific
stripe_checkout_session_duration_ms
stripe_webhook_processing_duration_ms
db_entitlement_check_duration_ms

# E-book delivery
signed_url_generation_duration_ms
storage_read_latency_ms
pdf_cache_hit_ratio

# Social network
coven_post_insert_duration_ms
activity_feed_query_duration_ms
realtime_notification_latency_ms

# Infrastructure
cpu_utilization_percent
memory_usage_bytes
database_connection_pool_usage
storage_request_rate
stripe_api_latency_ms
```

### Grafana dashboards to build
1. **Subscription Overview**: Checkout success rate, session latency, webhook processing time, duplicate prevention.
2. **E-Book Delivery**: Signed URL generation latency, PDF cache hit ratio, storage latency, concurrent readers.
3. **Social Network**: Post/comment insert rate, feed query latency, realtime notification lag.
4. **Infrastructure Health**: CPU/memory, DB pool, Stripe API dependency, storage throughput.

## 6. Horizontal Scaling Strategy

### Database (Supabase PostgreSQL)
- **Read replicas**: 3+ for high-volume reads (activity feeds, book lookups).
- **Connection pooling**: PgBouncer at 500–1000 connections per replica.
- **Partitioning**: Partition `coven_posts` by date; `book_chapters` by book_id.
- **Indexing**: Ensure `occult_subscriptions(user_id, status)`, `book_purchases(user_id, book_id)`, `coven_posts(created_at, user_id)` have indexes.

### Edge Functions (Supabase)
- Auto-scale by default (managed by Supabase).
- Monitor function invocation latency; alert if > 1000ms.

### Storage (Supabase / S3)
- Enable object CDN caching for `book-pdfs` (30-day TTL for stable PDFs).
- Multi-region replication if serving globally.

### Frontend (SPA)
- Static hosting (Vercel, Netlify, or S3 + CloudFront).
- Global CDN for JS/CSS bundles.

### Stripe integration
- Implement backoff + retry on `create-checkout-session` timeouts.
- Cache `get-stripe-prices` responses (5–10 min TTL).
- Maintain idempotency keys for all Stripe API calls to prevent double-charges.

## 7. Chaos Testing Scenarios

### Scenario 1: Stripe API downtime (5 min)
- **Action**: Simulate `create-checkout-session` always failing.
- **Expected**:
  - Clients see friendly error message ("Payment service temporarily unavailable").
  - Queued checkout attempts retry after 30s.
  - No data corruption or orphaned sessions.
- **Success**: Error count spikes but recovers within 2 min of Stripe restore.

### Scenario 2: PDF bucket inaccessible (1 min)
- **Action**: Revoke permissions on `book-pdfs` bucket.
- **Expected**:
  - `get-book-file` returns 403 Forbidden.
  - Clients show error ("Book temporarily unavailable").
  - Activity feed still works.
- **Success**: No cascading failures; isolated to book-serving.

### Scenario 3: Database connection pool exhaustion
- **Action**: Max out connection pool (100 connections).
- **Expected**:
  - New queries queue (managed by PgBouncer).
  - Requests timeout after 30s → retry → succeed.
  - No data loss.
- **Success**: Pool recovers; all queued requests eventually complete.

### Scenario 4: Node crash in multi-node deployment
- **Action**: Kill 1 of 3 app nodes.
- **Expected**:
  - Load balancer routes traffic away from failed node.
  - Requests for in-flight work may fail; clients retry.
  - No loss of data already written to database.
- **Success**: Error spike < 2%, recovery < 10s.

### Scenario 5: Webhook replay (Stripe retry)
- **Action**: Manually send the same Stripe webhook event 3 times.
- **Expected**:
  - Webhook handler is idempotent (checks event ID).
  - Only 1 subscription is created, not 3.
- **Success**: Subscription row count = 1; no duplicate charges.

## 8. Test Execution Plan

### Phase 1: Baseline (Day 1)
- Run each load test script with 100 concurrent users × 5 min.
- Record latency, error rates, and resource consumption.
- Establish P50/P95/P99 baseline.

### Phase 2: Stress (Day 2)
- Scale to 1,000 concurrent users × 10 min.
- Run all scenarios in parallel.
- Monitor database, Stripe API, and storage for bottlenecks.

### Phase 3: Chaos (Day 3)
- Introduce failures: Stripe timeout, DB pool exhaustion, node crash.
- Verify graceful degradation and recovery.

### Phase 4: Endurance (Day 4–5)
- Run 500 concurrent users × 24 hours.
- Watch for memory leaks, connection leaks, or data corruption.

## 9. Go/No-Go Criteria

| Criterion | Threshold | Pass/Fail |
| --- | --- | --- |
| Subscription P95 latency | < 200 ms | Required |
| E-book download P95 latency | < 500 ms | Required |
| Social API P95 latency | < 200 ms | Required |
| Overall error rate (all endpoints) | < 1% | Required |
| Stripe payment success rate | > 99% | Required |
| PDF access entitlement enforcement | 100% RLS pass | Required |
| Database query latency P95 | < 100 ms | Required |
| Webhook idempotency | 0 duplicate unlocks | Required |

## 10. Deployment & Rollout

1. **Staging validation**: Run full test suite in staging environment.
2. **Canary deployment**: Roll out to 5% of production traffic; monitor metrics.
3. **Progressive rollout**: 25% → 50% → 100% over 4 hours, with health checks between each phase.
4. **Production monitoring**: Alert on any threshold breach; auto-rollback if error rate > 5%.

---

## Running the Tests Locally

```bash
# 1. Start stub server (optional, for local dev)
npm run load:test:benchmark -- --target=http://127.0.0.1:3100/health

# 2. Against real staging/prod Supabase instance
npm run load:test:subscription -- \
  --target=https://your-project.supabase.co \
  --scenario=checkout \
  --concurrency=100 \
  --requests=1000

npm run load:test:ebook -- \
  --target=https://your-project.supabase.co \
  --concurrency=200 \
  --requests=2000

npm run load:test:social -- \
  --target=https://your-api.example.com \
  --scenario=post \
  --concurrency=500 \
  --requests=5000
```

## Success Metrics & Evidence Collection

After each run, capture:
1. **JSON summary** from each load-test script.
2. **Screenshots**: Grafana dashboard for the test window.
3. **Prometheus queries**: Export latency histograms, error rates.
4. **Log extracts**: Error logs, warnings, slow queries.
5. **Stripe dashboard**: Payment success rate, webhook delivery logs.
6. **Database metrics**: Query latency, connection pool usage, replication lag.

Compile into an **evidence report** (see [ops/evidence-report-template.md](evidence-report-template.md)) and sign off on **production readiness**.

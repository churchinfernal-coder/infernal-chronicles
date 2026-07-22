# Load Testing Quick Start

## Environment Setup

1. **Get your Supabase project URL**:
   ```bash
   export SUPABASE_URL="https://your-project-id.supabase.co"
   ```

2. **Generate a test auth token** (Supabase admin or authenticated user):
   ```bash
   export AUTH_TOKEN="your_bearer_token_here"
   ```

3. **Set Stripe test price IDs** (from your Stripe dashboard):
   ```bash
   export STRIPE_PRICE_ID="price_test_xxxxx"
   ```

## Quick Commands

### Health check
```bash
npm run load:test:benchmark -- --target=$SUPABASE_URL/health
```

### Subscription checkout load test (100 concurrent)
```powershell
npm run load:test:subscription -- --target=$SUPABASE_URL --scenario=checkout --concurrency=100 --requests=500 --authToken=$AUTH_TOKEN
```

### E-book file access (200 concurrent, 5 books)
```powershell
npm run load:test:ebook -- --target=$SUPABASE_URL --concurrency=200 --requests=1000 --authToken=$AUTH_TOKEN
```

### Social API post creation (500 concurrent)
```powershell
npm run load:test:social -- --target=$SUPABASE_URL --scenario=post --concurrency=500 --requests=5000 --authToken=$AUTH_TOKEN
```

## Interpreting Results

Each test outputs a JSON summary:

```json
{
  "ok": true,
  "summary": {
    "scenario": "checkout",
    "url": "https://...",
    "concurrency": 100,
    "requests": 500,
    "successCount": 495,
    "errorCount": 5,
    "errorRate": "1.00",
    "averageLatencyMs": "145.23 ms",
    "p50LatencyMs": "123.45 ms",
    "p95LatencyMs": "234.56 ms",
    "p99LatencyMs": "512.34 ms",
    "bytesTransferred": 123456
  }
}
```

### ✅ Production-ready thresholds
- **Subscription**: P95 < 200ms, error < 1%
- **E-book**: P95 < 500ms, error < 1%
- **Social**: P95 < 200ms, error < 1%

### ⚠️ Yellow flags
- P95 > 2× baseline (investigate bottleneck)
- Error rate > 5% (possible infrastructure issue)
- High variance P99/P95 (possible tail latency problem)

## Scaling Test Scenarios

| Load Level | Concurrent | Requests | Duration | Purpose |
| --- | --- | --- | --- | --- |
| Baseline | 50 | 200 | ~5s | Establish normal latency |
| Moderate | 200 | 1000 | ~30s | Realistic peak hour |
| Heavy | 1000 | 5000 | ~2 min | Stress test |
| Extreme | 2000+ | 10000+ | ~5 min | Breaking point identification |

## Running Full Suite (All Scenarios)

**PowerShell:**
```powershell
$SUPABASE_URL = "https://your-project.supabase.co"
$AUTH_TOKEN = "your_token"

Write-Host "=== Baseline ==="
npm run load:test:benchmark -- --target=$SUPABASE_URL/health

Write-Host "=== Subscription Checkout (100 concurrent) ==="
npm run load:test:subscription -- --target=$SUPABASE_URL --scenario=checkout --concurrency=100 --requests=500 --authToken=$AUTH_TOKEN

Write-Host "=== E-book Access (200 concurrent) ==="
npm run load:test:ebook -- --target=$SUPABASE_URL --concurrency=200 --requests=1000 --authToken=$AUTH_TOKEN

Write-Host "=== Social Posting (500 concurrent) ==="
npm run load:test:social -- --target=$SUPABASE_URL --scenario=post --concurrency=500 --requests=2500 --authToken=$AUTH_TOKEN

Write-Host "✅ All tests complete. Review results above."
```

**Bash:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export AUTH_TOKEN="your_token"

echo "=== Baseline ==="
npm run load:test:benchmark -- --target=$SUPABASE_URL/health

echo "=== Subscription Checkout (100 concurrent) ==="
npm run load:test:subscription -- --target=$SUPABASE_URL --scenario=checkout --concurrency=100 --requests=500 --authToken=$AUTH_TOKEN

echo "=== E-book Access (200 concurrent) ==="
npm run load:test:ebook -- --target=$SUPABASE_URL --concurrency=200 --requests=1000 --authToken=$AUTH_TOKEN

echo "=== Social Posting (500 concurrent) ==="
npm run load:test:social -- --target=$SUPABASE_URL --scenario=post --concurrency=500 --requests=2500 --authToken=$AUTH_TOKEN

echo "✅ All tests complete. Review results above."
```

## Saving Results

**PowerShell:**
```powershell
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$resultsDir = "results"
if (-not (Test-Path $resultsDir)) { New-Item -ItemType Directory -Path $resultsDir | Out-Null }

npm run load:test:subscription -- --target=$SUPABASE_URL --scenario=checkout --concurrency=100 --requests=500 --authToken=$AUTH_TOKEN | Tee-Object -FilePath "$resultsDir/subscription-test-$timestamp.json"

npm run load:test:ebook -- --target=$SUPABASE_URL --concurrency=200 --requests=1000 --authToken=$AUTH_TOKEN | Tee-Object -FilePath "$resultsDir/ebook-test-$timestamp.json"

npm run load:test:social -- --target=$SUPABASE_URL --scenario=post --concurrency=500 --requests=2500 --authToken=$AUTH_TOKEN | Tee-Object -FilePath "$resultsDir/social-test-$timestamp.json"
```

**Bash:**
```bash
npm run load:test:subscription \
  --target=$SUPABASE_URL \
  --scenario=checkout \
  --concurrency=100 \
  --requests=500 \
  --authToken=$AUTH_TOKEN > results/subscription-test-$(date +%s).json

npm run load:test:ebook \
  --target=$SUPABASE_URL \
  --concurrency=200 \
  --requests=1000 \
  --authToken=$AUTH_TOKEN > results/ebook-test-$(date +%s).json

npm run load:test:social \
  --target=$SUPABASE_URL \
  --scenario=post \
  --concurrency=500 \
  --requests=2500 \
  --authToken=$AUTH_TOKEN > results/social-test-$(date +%s).json
```

Then compile into your evidence report (see [ops/evidence-report-template.md](evidence-report-template.md)).

## Common Issues

### "Failed to send request" errors
- Check `AUTH_TOKEN` is valid and has permission for the endpoint.
- Confirm `SUPABASE_URL` is correct and includes the protocol (`https://`).

### High error rates on first run
- Warm up the service with a small test first (10 concurrent, 50 requests).
- Check Supabase function logs for any errors.

### Spike in latency after 2-3 min
- May indicate connection pool saturation or memory pressure.
- Scale back concurrency or add more Supabase read replicas.

### 429 / Rate-limited responses
- Supabase may throttle aggressive load.
- Reduce concurrency and retry after 60s.

---

For full details, see [ops/PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

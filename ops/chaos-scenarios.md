# Chaos Testing Scenarios

## 1. Gateway outage
- Simulate Stripe or payment provider timeout and 5xx bursts.
- Expected behavior: queues, retries with backoff, idempotency keys, and no duplicate charges.

## 2. Delayed transaction confirmation
- Introduce 30-60s delay before webhook confirmation.
- Expected behavior: pending state, reconciliation job, and user-visible status handling.

## 3. Node crashes
- Kill a replica and verify traffic moves to healthy nodes without data loss.

## 4. Slow content delivery
- Inject latency into CDN or storage responses to validate cache hit ratios and timeouts.

## 5. Database saturation
- Apply connection-pool pressure to validate read replicas and queue-based write buffering.

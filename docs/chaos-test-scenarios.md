# Chaos Testing Scenarios

## 1. Payment Gateway Outage

- Simulate Stripe or payment-provider downtime
- Verify webhook retries and idempotency
- Confirm subscription state remains consistent
- Expected result: graceful degradation and no duplicate charges

## 2. Delayed Transaction Confirmation

- Delay webhook or confirmation response for 30-120 seconds
- Ensure retries are bounded and idempotent
- Expected result: no duplicate subscription activation and correct eventual consistency

## 3. Node Crash During Checkout

- Kill a checkout worker pod/node mid-request
- Confirm autoscaling and session recovery
- Expected result: request retries or compaction without data loss

## 4. Delayed Content Delivery

- Introduce latency for e-book delivery or CDN origin
- Confirm cache fallback and signed URL access enforcement
- Expected result: cache serves warmed content and unauthorized access remains blocked

## 5. Database Latency Spike

- Inject high latency into the primary database
- Verify read replicas or cached read paths handle traffic
- Expected result: degraded but available service with controlled error rates

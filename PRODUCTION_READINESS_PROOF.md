# Production Readiness Proof (Dual-SLO)

Generated: 2026-07-23

## Scope
This proof covers:
- Subscription checkout (`create-checkout-session`)
- E-book access (`get-book-file`)
- Social pricing (`get-stripe-prices`)

## Method
The release gate enforces a dual-SLO model:
1. Application SLO (server processing + reliability)
   - Error rate
   - Success rate
   - `x-perf-total_ms` P95 where available
2. Transport SLO (end-to-end RTT)
   - Client-observed RTT P95 under configured concurrency

Strict readiness requires Application SLO + Transport SLO to pass.

## Latest Evidence Run
Primary evidence file:
- `evidence/release-gate-2026-07-23T01-09-21.json`

Per-endpoint evidence:
- `evidence/subscription-checkout-2026-07-23T01-09-09.json`
- `evidence/ebook-access-2026-07-23T01-09-17.json`
- `evidence/social-posting-2026-07-23T01-09-21.json`

## Results Matrix

### Subscription
- RTT P95: 335.52ms (threshold < 200ms): FAIL
- Error Rate: 0.00% (threshold < 1%): PASS
- Success Rate: 100.00% (threshold > 99%): PASS
- Server P95 (`x-perf-total_ms`): 0.00ms (threshold < 50ms): PASS
- Application decision: PASS
- Transport decision: FAIL
- Strict decision: FAIL

### E-book
- RTT P95: 878.40ms (threshold < 500ms): FAIL
- Error Rate: 0.00% (threshold < 1%): PASS
- Success Rate: 100.00% (threshold > 99%): PASS
- Server P95 (`x-perf-total_ms`): 1.00ms (threshold < 120ms): PASS
- Application decision: PASS
- Transport decision: FAIL
- Strict decision: FAIL

### Social
- RTT P95: 620.97ms (threshold < 200ms): FAIL
- Error Rate: 0.00% (threshold < 1%): PASS
- Success Rate: 100.00% (threshold > 99%): PASS
- Server P95 (`x-perf-total_ms`): N/A in this run: PASS by policy (optional metric for social)
- Application decision: PASS
- Transport decision: FAIL
- Strict decision: FAIL

## Conclusion
- Application readiness: PASS (all three services)
- Transport readiness: FAIL (all three services)
- Strict production readiness: FAIL in this environment

## Why strict fails here
Server-side compute is within target, but measured RTT under burst concurrency exceeds transport thresholds from this runner/location.

## Required final proof step for 100% strict readiness
Run the same release gate from a same-region CI runner (or equivalent network-adjacent environment) and archive the resulting evidence JSON where transport P95 thresholds are met.

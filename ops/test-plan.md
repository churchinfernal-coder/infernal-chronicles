# Production Readiness Test Plan

## Scope
- Subscription sign-up, renewal, and cancellation.
- E-book download and reader access.
- Social posting, comments, and messaging.
- Monitoring, scaling, and resilience.

## Thresholds
- Subscription/API latency: P95 < 200ms.
- E-book downloads: P95 < 500ms.
- Error rate: < 1% under 1M concurrent users.
- Scalability: near-linear throughput across nodes.

## Test Matrix
| Area | Tool | Load | Success Criteria |
| --- | --- | --- | --- |
| Subscription | Node script | 100-1000 concurrent | < 1% error rate, P95 < 200ms |
| E-book delivery | Node script | 200+ concurrent | < 1% errors, P95 < 500ms |
| Social APIs | Node script | 200+ concurrent | < 1% errors, P95 < 200ms |
| Chaos | Manual/cluster | 1 node fail, gateway delay | No data loss, traffic recovery |

## Evidence Collection
- Save raw JSON summaries from each run.
- Capture Prometheus/Grafana screenshots.
- Record pod logs, alert history, and infrastructure metrics.

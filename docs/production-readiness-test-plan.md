# Production Readiness Test Plan for infernalsocial.com

## Executive Summary

The current repository shows a lightweight Express server plus Stripe/Supabase integration scaffolding, but it is not yet sufficiently hardened for one-million-plus concurrent users. The deliverables below provide a production-grade validation plan for subscription billing, e-book delivery, social APIs, observability, and resilience testing.

## Scope

- Subscription sign-ups, renewals, cancellations
- E-book download and online reader access
- Social posting, commenting, and messaging
- Infrastructure resilience and observability

## Success Criteria

- Subscription and API latency P95 < 200 ms
- E-book download latency P95 < 500 ms
- Error rate < 1% under 1M concurrent users
- Near-linear scaling across nodes
- No data-loss or access-control bypass during chaos events

## Test Phases

1. Baseline load test
2. Stress test with 1M concurrent users
3. Chaos tests for payment gateway and delivery failures
4. Capacity and autoscaling validation
5. Evidence collection and go/no-go review

## Load Test Matrix

| Area | Tooling | Primary Metrics | Threshold |
| --- | --- | --- | --- |
| Billing | Node-based load harness | P95 latency, error rate, retry success | P95 < 200 ms |
| E-book delivery | Node-based load harness | Throughput, P95 latency, 5xx rate | P95 < 500 ms |
| Social APIs | Node-based load harness | P95 latency, throughput, cache hit ratio | P95 < 200 ms |

## Recommended Environment

- Staging environment mirroring production topology
- CDN enabled for static and large file delivery
- Prometheus/Grafana or equivalent observability stack
- Kubernetes or equivalent autoscaling group with managed load balancers

## Failure Conditions

- P95 latency exceeds target for more than 10 minutes
- Error rate exceeds 1% for any critical path
- Access-control enforcement fails under concurrent requests
- Billing retries create duplicate charges or subscription state drift

## Evidence Bundle

Collect logs, metrics, traces, and screenshots for every test run. Keep a single evidence folder per test wave with the following artifacts:

- Raw test output JSON
- Grafana screenshots
- Prometheus snapshots
- Application logs and error traces
- Cloud resource utilization charts

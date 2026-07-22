# Prometheus and Grafana Monitoring Design

## Prometheus Scrape Targets

```yaml
scrape_configs:
  - job_name: 'node-app'
    static_configs:
      - targets: ['app:9100']
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

## Key Metrics

- http_request_duration_seconds_bucket
- http_requests_total
- http_request_errors_total
- node_cpu_seconds_total
- node_memory_MemAvailable_bytes
- redis_commands_processed_total
- stripe_webhook_latency_seconds

## Grafana Dashboards

### Dashboard 1: API Performance

Panels:
- P95 latency by route
- P99 latency by route
- Request rate
- Error rate

### Dashboard 2: Billing Reliability

Panels:
- Checkout success rate
- Payment gateway latency
- Webhook retry count
- Subscription state drift

### Dashboard 3: Content Delivery

Panels:
- Download throughput
- CDN hit ratio
- Cache hit ratio
- Reader API latency

## Alert Rules

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighP95Latency
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 0.2
        for: 10m
        labels:
          severity: critical
      - alert: ErrorRateHigh
        expr: sum(rate(http_request_errors_total[5m])) / sum(rate(http_requests_total[5m])) > 0.01
        for: 10m
        labels:
          severity: critical
```

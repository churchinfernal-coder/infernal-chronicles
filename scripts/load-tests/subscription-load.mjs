#!/usr/bin/env node
import { performance } from 'node:perf_hooks';

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const [flag, value] = token.split('=');
    const key = flag.slice(2);
    parsed[key] = value ?? argv[i + 1] ?? true;
  }
  return parsed;
}

function buildHeaders(args) {
  const headers = { 'content-type': 'application/json' };
  const authToken = args.authToken ?? process.env.AUTH_TOKEN;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

async function runScenario({ target, scenario, concurrency, requests, timeoutMs, headers }) {
  const url = new URL(target);
  const scenarioConfig = {
    checkout: { method: 'POST', endpoint: '/functions/v1/create-checkout-session', body: { userId: `user-${Math.random()}`, productType: 'library', priceId: 'price_test_' + Math.random().toString(36).slice(2), mode: 'subscription' } },
    signup: { method: 'POST', endpoint: '/functions/v1/create-checkout-session', body: { userId: `user-${Math.random()}`, productType: 'library', priceId: 'price_test_' + Math.random().toString(36).slice(2), mode: 'subscription' } },
    check: { method: 'POST', endpoint: '/functions/v1/check-subscription', body: { userId: `user-${Math.random()}` } },
    webhook: { method: 'POST', endpoint: '/functions/v1/stripe-webhook', body: { type: 'checkout.session.completed', data: { object: { id: 'cs_test_' + Math.random().toString(36).slice(2), metadata: { userId: `user-${Math.random()}`, productType: 'library' } } } } }
  }[scenario];

  if (!scenarioConfig) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }

  const fullUrl = new URL(scenarioConfig.endpoint, url).toString();
  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let bytes = 0;

  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    for (let i = 0; i < Math.ceil(requests / concurrency); i += 1) {
      const startedAt = performance.now();
      try {
        const response = await fetch(fullUrl, {
          method: scenarioConfig.method,
          headers,
          body: JSON.stringify({ ...scenarioConfig.body, requestId: `${workerIndex}-${i}` })
        });
        const payload = await response.text();
        const duration = performance.now() - startedAt;
        latencies.push(duration);
        bytes += payload.length;
        if (response.ok) {
          successCount += 1;
        } else {
          errorCount += 1;
        }
      } catch (error) {
        const duration = performance.now() - startedAt;
        latencies.push(duration);
        errorCount += 1;
        console.error(`[${scenario}] request failed:`, error.message);
      }
      if (timeoutMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }
  });

  await Promise.all(workers);

  return {
    scenario,
    url: fullUrl,
    concurrency,
    requests: requests,
    successCount,
    errorCount,
    latencies,
    bytes,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    average: latencies.reduce((sum, item) => sum + item, 0) / Math.max(1, latencies.length)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = args.target ?? process.env.TARGET ?? 'http://127.0.0.1:3000';
  const scenario = args.scenario ?? process.env.SCENARIO ?? 'checkout';
  const concurrency = Number(args.concurrency ?? process.env.CONCURRENCY ?? 100);
  const requests = Number(args.requests ?? process.env.REQUESTS ?? 1000);
  const timeoutMs = Number(args.timeoutMs ?? process.env.TIMEOUT_MS ?? 5000);
  const headers = buildHeaders(args);

  const summary = await runScenario({ target, scenario, concurrency, requests, timeoutMs, headers });
  console.log(JSON.stringify({
    ok: true,
    summary: {
      scenario: summary.scenario,
      url: summary.url,
      concurrency: summary.concurrency,
      requests: summary.requests,
      successCount: summary.successCount,
      errorCount: summary.errorCount,
      errorRate: ((summary.errorCount / summary.requests) * 100).toFixed(2),
      averageLatencyMs: formatMs(summary.average),
      p50LatencyMs: formatMs(summary.p50),
      p95LatencyMs: formatMs(summary.p95),
      p99LatencyMs: formatMs(summary.p99),
      bytesTransferred: summary.bytes
    }
  }, null, 2));
}

main().catch((error) => {
  console.error('Subscription load test failed:', error);
  process.exitCode = 1;
});

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

async function runScenario({ target, scenario, concurrency, requests, headers }) {
  const scenarioConfig = {
    post: { method: 'POST', endpoint: '/api/social/posts', body: { text: 'Load test post from performance suite', visibility: 'public', type: 'coven', covenId: 'coven-1' } },
    comment: { method: 'POST', endpoint: '/api/social/comments', body: { text: 'Load test response to suite', postId: 'post-1', visibility: 'public' } },
    message: { method: 'POST', endpoint: '/api/social/messages', body: { recipientId: 'user-1', text: 'Load test message' } },
    search: { method: 'GET', endpoint: '/api/social/search?q=test&limit=20', body: null }
  }[scenario];

  const fullUrl = new URL(scenarioConfig.endpoint, target).toString();
  const latencies = [];
  let successCount = 0;
  let errorCount = 0;

  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    for (let i = 0; i < Math.ceil(requests / concurrency); i += 1) {
      const startedAt = performance.now();
      try {
        const response = await fetch(fullUrl, {
          method: scenarioConfig.method,
          headers,
          body: JSON.stringify({ ...scenarioConfig.body, requestId: `${workerIndex}-${i}` })
        });
        const duration = performance.now() - startedAt;
        latencies.push(duration);
        if (response.ok) {
          successCount += 1;
        } else {
          errorCount += 1;
        }
      } catch (error) {
        const duration = performance.now() - startedAt;
        latencies.push(duration);
        errorCount += 1;
        console.error('[social] request failed:', error.message);
      }
    }
  });

  await Promise.all(workers);

  return {
    scenario,
    url: fullUrl,
    concurrency,
    requests,
    successCount,
    errorCount,
    latencies,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    average: latencies.reduce((sum, item) => sum + item, 0) / Math.max(1, latencies.length)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = args.target ?? process.env.TARGET ?? 'http://127.0.0.1:3000';
  const scenario = args.scenario ?? process.env.SCENARIO ?? 'post';
  const concurrency = Number(args.concurrency ?? process.env.CONCURRENCY ?? 200);
  const requests = Number(args.requests ?? process.env.REQUESTS ?? 2000);

  const headers = buildHeaders(args);
  const summary = await runScenario({ target, scenario, concurrency, requests, headers });
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
      averageLatencyMs: summary.average.toFixed(2),
      p50LatencyMs: summary.p50.toFixed(2),
      p95LatencyMs: summary.p95.toFixed(2),
      p99LatencyMs: summary.p99.toFixed(2)
    }
  }, null, 2));
}

main().catch((error) => {
  console.error('Social API load test failed:', error);
  process.exitCode = 1;
});

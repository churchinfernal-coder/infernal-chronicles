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
  const headers = { accept: 'application/pdf,application/octet-stream' };
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

async function runScenario({ target, concurrency, requests, headers }) {
  const endpoint = '/functions/v1/get-book-file';
  const fullUrl = new URL(endpoint, target).toString();
  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let bytes = 0;

  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    for (let i = 0; i < Math.ceil(requests / concurrency); i += 1) {
      const startedAt = performance.now();
      try {
        const bookId = `book-${i % 5}`;
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ bookId, download: false })
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
        console.error('[ebook] request failed:', error.message);
      }
    }
  });

  await Promise.all(workers);

  return {
    url: fullUrl,
    concurrency,
    requests,
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
  const concurrency = Number(args.concurrency ?? process.env.CONCURRENCY ?? 200);
  const requests = Number(args.requests ?? process.env.REQUESTS ?? 2000);

  const headers = buildHeaders(args);
  const summary = await runScenario({ target, concurrency, requests, headers });
  console.log(JSON.stringify({
    ok: true,
    summary: {
      url: summary.url,
      concurrency: summary.concurrency,
      requests: summary.requests,
      successCount: summary.successCount,
      errorCount: summary.errorCount,
      errorRate: ((summary.errorCount / summary.requests) * 100).toFixed(2),
      averageLatencyMs: summary.average.toFixed(2),
      p50LatencyMs: summary.p50.toFixed(2),
      p95LatencyMs: summary.p95.toFixed(2),
      p99LatencyMs: summary.p99.toFixed(2),
      bytesTransferred: summary.bytes
    }
  }, null, 2));
}

main().catch((error) => {
  console.error('E-book load test failed:', error);
  process.exitCode = 1;
});

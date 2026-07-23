#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://khugyibzsujjgtddwzpa.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!ANON_KEY) {
  console.error('Missing anon key: VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function stats(values) {
  if (!values.length) return { count: 0, p50: 0, p95: 0, p99: 0, avg: 0 };
  const total = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    avg: total / values.length,
  };
}

async function runScenario({ name, endpoint, method, payload, concurrency, requests, expectedStatuses }) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const latencies = [];
  const statusCounts = new Map();
  const perfByStage = new Map();
  let success = 0;
  let failed = 0;

  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    for (let i = 0; i < Math.ceil(requests / concurrency); i += 1) {
      const started = performance.now();
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ANON_KEY}`,
          },
          body: method === 'POST' ? JSON.stringify(payload) : undefined,
        });
        const duration = performance.now() - started;
        latencies.push(duration);

        const statusKey = String(response.status);
        statusCounts.set(statusKey, (statusCounts.get(statusKey) || 0) + 1);

        const isSuccess = expectedStatuses.includes(response.status);
        if (isSuccess) {
          success += 1;
        } else {
          failed += 1;
        }

        for (const [key, value] of response.headers.entries()) {
          if (!key.startsWith('x-perf-')) continue;
          const numeric = Number(value);
          if (!Number.isFinite(numeric)) continue;
          const stage = key.slice('x-perf-'.length);
          if (!perfByStage.has(stage)) perfByStage.set(stage, []);
          perfByStage.get(stage).push(numeric);
        }
      } catch {
        failed += 1;
      }
    }
  });

  await Promise.all(workers);

  const stageStats = {};
  for (const [stage, values] of perfByStage.entries()) {
    stageStats[stage] = stats(values);
  }

  return {
    name,
    endpoint,
    url,
    requests,
    concurrency,
    success,
    failed,
    successRate: ((success / requests) * 100).toFixed(2),
    totalLatency: stats(latencies),
    statusCounts: Object.fromEntries([...statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))),
    stageStats,
  };
}

function printScenario(result) {
  console.log(`\n=== ${result.name} ===`);
  console.log(`endpoint: ${result.endpoint}`);
  console.log(`success: ${result.success}/${result.requests} (${result.successRate}%)`);
  console.log(`status counts: ${JSON.stringify(result.statusCounts)}`);
  console.log(
    `latency ms p50=${result.totalLatency.p50.toFixed(2)} p95=${result.totalLatency.p95.toFixed(2)} p99=${result.totalLatency.p99.toFixed(2)} avg=${result.totalLatency.avg.toFixed(2)}`
  );

  const stages = Object.entries(result.stageStats).sort((a, b) => b[1].p95 - a[1].p95);
  if (!stages.length) {
    console.log('no x-perf-* headers observed');
    return;
  }

  console.log('stage timings (ms, sorted by p95):');
  for (const [stage, s] of stages) {
    console.log(`  ${stage}: p50=${s.p50.toFixed(2)} p95=${s.p95.toFixed(2)} p99=${s.p99.toFixed(2)} avg=${s.avg.toFixed(2)} n=${s.count}`);
  }
}

async function main() {
  console.log('Running perf attribution using x-perf-* response headers...');

  const subscription = await runScenario({
    name: 'subscription-checkout (anon path)',
    endpoint: '/functions/v1/create-checkout-session',
    method: 'POST',
    payload: { priceId: 'price_1R7h3AC79jfp0Sqd8ql4LkHJ', mode: 'subscription' },
    concurrency: 50,
    requests: 500,
    expectedStatuses: [200, 401, 403],
  });

  const ebook = await runScenario({
    name: 'ebook-access (anon path)',
    endpoint: '/functions/v1/get-book-file',
    method: 'POST',
    payload: { bookId: 'book-1', download: false },
    concurrency: 100,
    requests: 500,
    expectedStatuses: [200, 401, 403],
  });

  printScenario(subscription);
  printScenario(ebook);
}

main().catch((error) => {
  console.error('Perf attribution failed:', error);
  process.exit(1);
});

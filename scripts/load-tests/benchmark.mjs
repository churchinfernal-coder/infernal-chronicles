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

async function benchmarkEndpoint(target, method = 'GET') {
  const latencies = [];
  for (let i = 0; i < 25; i += 1) {
    const startedAt = performance.now();
    try {
      await fetch(target, { method });
      latencies.push(performance.now() - startedAt);
    } catch (error) {
      latencies.push(5000);
    }
  }
  return {
    samples: latencies.length,
    averageMs: latencies.reduce((sum, item) => sum + item, 0) / latencies.length,
    maxMs: Math.max(...latencies)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = args.target ?? process.env.TARGET ?? 'http://127.0.0.1:3000/health';
  const method = args.method ?? 'GET';
  const result = await benchmarkEndpoint(target, method);
  console.log(JSON.stringify({ ok: true, target, method, ...result }, null, 2));
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exitCode = 1;
});

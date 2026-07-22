/**
 * Base Gate Test Framework
 * Shared infrastructure for all hard production gates
 * 
 * Usage:
 *   import { BaseGate } from './base-gate.mjs';
 *   const gate = new BaseGate('subscription-test');
 *   await gate.runTest(testFunction);
 */

import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';

export class BaseGate {
  constructor(testName) {
    this.testName = testName;
    this.timestamp = new Date().toISOString();
    this.results = {
      name: testName,
      timestamp: this.timestamp,
      tests: [],
      passed: 0,
      failed: 0,
      metrics: {},
      errors: []
    };
    this.evidenceDir = path.join(process.cwd(), 'evidence');
    
    // Ensure evidence directory exists
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }
  }

  /**
   * Calculate percentiles from array of values
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Run concurrent test with load testing
   */
  async runLoadTest(config) {
    const { name, target, method = 'POST', payload = {}, concurrency = 50, requests = 500, headers = {} } = config;
    
    console.log(`\n[LOAD TEST] ${name}`);
    console.log(`  Target: ${target}`);
    console.log(`  Concurrency: ${concurrency}, Requests: ${requests}`);

    const latencies = [];
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const testStartTime = performance.now();

    // Create worker pool
    const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
      for (let i = 0; i < Math.ceil(requests / concurrency); i++) {
        const requestStartedAt = performance.now();
        try {
          const response = await fetch(target, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            body: method === 'POST' ? JSON.stringify(payload) : undefined,
          });

          const duration = performance.now() - requestStartedAt;
          latencies.push(duration);

          // Accept 200, 401, 403 (auth failures are expected in tests)
          if (response.ok || response.status === 401 || response.status === 403) {
            successCount++;
          } else {
            errorCount++;
            errors.push({
              status: response.status,
              worker: workerIndex,
              requestNum: i,
            });
          }
        } catch (error) {
          const duration = performance.now() - requestStartedAt;
          latencies.push(duration);
          errorCount++;
          errors.push({
            error: error.message,
            worker: workerIndex,
            requestNum: i,
          });
        }
      }
    });

    await Promise.all(workers);
    const testDuration = performance.now() - testStartTime;

    // Calculate metrics
    const totalRequests = requests;
    const successRate = ((successCount / totalRequests) * 100).toFixed(2);
    const errorRate = ((errorCount / totalRequests) * 100).toFixed(2);
    const p50 = this.percentile(latencies, 50);
    const p95 = this.percentile(latencies, 95);
    const p99 = this.percentile(latencies, 99);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    const result = {
      name,
      target,
      config,
      results: {
        totalRequests,
        successCount,
        errorCount,
        errorRate,
        successRate,
        totalDuration: testDuration.toFixed(2),
        averageLatency: avgLatency.toFixed(2),
        p50Latency: p50.toFixed(2),
        p95Latency: p95.toFixed(2),
        p99Latency: p99.toFixed(2),
      },
      errors: errors.slice(0, 20), // First 20 errors only
    };

    console.log(`  ✓ Completed: ${successRate}% success, P95: ${p95.toFixed(2)}ms`);

    this.results.tests.push(result);
    return result;
  }

  /**
   * Add a simple test
   */
  async addTest(name, testFn) {
    console.log(`\n[TEST] ${name}`);
    try {
      const startTime = performance.now();
      const result = await testFn();
      const duration = performance.now() - startTime;

      this.results.tests.push({
        name,
        status: 'PASS',
        duration: duration.toFixed(2),
        ...result,
      });

      console.log(`  ✓ PASS (${duration.toFixed(2)}ms)`);
      this.results.passed++;
      return true;
    } catch (error) {
      this.results.tests.push({
        name,
        status: 'FAIL',
        error: error.message,
      });

      console.log(`  ✗ FAIL: ${error.message}`);
      this.results.failed++;
      return false;
    }
  }

  /**
   * Evaluate metrics against thresholds
   */
  evaluateMetric(name, actual, threshold, operator = '<', unit = 'ms') {
    let pass = false;
    
    if (operator === '<') {
      pass = actual < threshold;
    } else if (operator === '>') {
      pass = actual > threshold;
    } else if (operator === '===') {
      pass = actual === threshold;
    }

    const status = pass ? '✓' : '✗';
    console.log(`  ${status} ${name}: ${operator} ${threshold} (actual: ${actual.toFixed(2)}${unit})`);

    this.results.metrics[name] = {
      actual,
      threshold,
      operator,
      unit,
      pass,
    };

    return pass;
  }

  /**
   * Save evidence to file
   */
  saveEvidence() {
    const filename = `${this.testName}-${this.timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(this.evidenceDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n📝 Evidence: ${filepath}`);

    return filepath;
  }

  /**
   * Determine final gate decision
   */
  getDecision() {
    // All metrics must pass for gate to pass
    const allMetricsPass = Object.values(this.results.metrics || {}).every(m => m.pass);
    const noFailedTests = this.results.failed === 0;

    return allMetricsPass && noFailedTests ? 'PASS' : 'FAIL';
  }

  /**
   * Print gate result
   */
  printResult() {
    const decision = this.getDecision();
    const status = decision === 'PASS' ? '✓ PASS' : '✗ FAIL';

    console.log(`\n${'='.repeat(80)}`);
    console.log(`GATE RESULT: ${status}`);
    console.log(`${'='.repeat(80)}`);

    return decision === 'PASS' ? 0 : 1;
  }
}

/**
 * K6 Soak Test
 *
 * Tests the API's behavior under sustained load over an extended period.
 * Identifies memory leaks, resource exhaustion, and degradation over time.
 *
 * Duration: ~1 hour
 * - 5 minute ramp up to 100 VUs
 * - 50 minutes at 100 VUs
 * - 5 minute ramp down
 *
 * Run: k6 run --env API_URL=http://localhost:3001 load-tests/k6/soak-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { config, randomItem, randomWallet, defaultHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up to 100 VUs
    { duration: '50m', target: 100 },  // Stay at 100 for 50 minutes
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    // Soak tests need consistent performance
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],  // Consistent response times
    http_req_failed: ['rate<0.01'],                   // Very low error rate
    iteration_duration: ['p(95)<5000'],               // Full iteration under 5s
  },
  tags: {
    testType: 'soak',
  },
};

// Custom metrics for soak test
const errorRate = new Rate('errors');
const iterationDuration = new Trend('iteration_duration_ms');
const responseTimeOverTime = new Trend('response_time_over_time');
const memoryIndicator = new Gauge('memory_indicator');
const requestsTotal = new Counter('requests_total');

// Track performance degradation
let iterationCount = 0;
let startTimeMs = Date.now();

export default function() {
  const baseUrl = config.apiUrl;
  const iterationStart = new Date();

  iterationCount++;

  // Calculate time elapsed (for trend analysis)
  const elapsedMinutes = (Date.now() - startTimeMs) / 60000;

  group('Core API Calls', () => {
    // Health check (quick, should always work)
    const healthRes = http.get(`${baseUrl}/health`, {
      headers: defaultHeaders,
      timeout: '5s',
    });

    check(healthRes, {
      'health check OK': (r) => r.status === 200,
    });

    requestsTotal.add(1);
    sleep(0.2);

    // Token list (common operation)
    const tokensRes = http.get(`${baseUrl}/api/tokens`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    const tokensOk = check(tokensRes, {
      'tokens list OK': (r) => r.status === 200,
      'tokens response time OK': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!tokensOk);
    responseTimeOverTime.add(tokensRes.timings.duration);
    requestsTotal.add(1);
    sleep(0.3);

    // Platform stats (aggregation query)
    const statsRes = http.get(`${baseUrl}/api/stats/platform`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    const statsOk = check(statsRes, {
      'platform stats OK': (r) => r.status === 200,
      'stats response time OK': (r) => r.timings.duration < 1500,
    });

    errorRate.add(!statsOk);
    responseTimeOverTime.add(statsRes.timings.duration);
    requestsTotal.add(1);
    sleep(0.3);

    // Staking pool info
    const poolRes = http.get(`${baseUrl}/api/staking/pool`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    check(poolRes, {
      'staking pool OK': (r) => r.status === 200,
    });

    requestsTotal.add(1);
  });

  group('Secondary Operations', () => {
    // Recent tokens
    const recentRes = http.get(`${baseUrl}/api/tokens/recent`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    check(recentRes, {
      'recent tokens OK': (r) => r.status === 200,
    });

    requestsTotal.add(1);
    sleep(0.2);

    // Trending tokens
    const trendingRes = http.get(`${baseUrl}/api/stats/trending`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    check(trendingRes, {
      'trending OK': (r) => r.status === 200,
    });

    requestsTotal.add(1);
    sleep(0.2);

    // Staking tiers
    const tiersRes = http.get(`${baseUrl}/api/staking/tiers`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    check(tiersRes, {
      'staking tiers OK': (r) => r.status === 200,
    });

    requestsTotal.add(1);
  });

  group('Wallet-Specific Operations', () => {
    const wallet = randomItem(config.testWallets);

    // Staking status
    const statusRes = http.get(`${baseUrl}/api/staking/status/${wallet}`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    check(statusRes, {
      'staking status OK': (r) => r.status === 200 || r.status === 404,
    });

    requestsTotal.add(1);
    sleep(0.2);

    // Creator stats
    const creatorRes = http.get(`${baseUrl}/api/stats/creator/${wallet}`, {
      headers: defaultHeaders,
      timeout: '10s',
    });

    check(creatorRes, {
      'creator stats OK': (r) => r.status === 200 || r.status === 404,
    });

    requestsTotal.add(1);
  });

  // Track iteration duration
  const iterationEnd = new Date();
  const duration = iterationEnd - iterationStart;
  iterationDuration.add(duration);

  // Update memory indicator (proxy metric - response times can indicate memory pressure)
  // This isn't real memory, but sustained degradation suggests issues
  memoryIndicator.add(Math.max(0, duration - 2000)); // Time over 2s baseline

  // Log periodic status (every 100 iterations per VU)
  if (iterationCount % 100 === 0) {
    console.log(`VU iteration ${iterationCount}: ${duration}ms, elapsed: ${elapsedMinutes.toFixed(1)} min`);
  }

  // Think time between iterations
  sleep(1);
}

export function setup() {
  console.log('='.repeat(60));
  console.log('SOAK TEST STARTING');
  console.log('='.repeat(60));
  console.log(`Target: ${config.apiUrl}`);
  console.log('Duration: ~1 hour');
  console.log('Purpose: Identify memory leaks and degradation over time');
  console.log('='.repeat(60));

  // Verify API is healthy before starting
  const healthRes = http.get(`${config.apiUrl}/health`, {
    timeout: '10s',
  });

  if (healthRes.status !== 200) {
    console.error(`Warning: API health check failed with status ${healthRes.status}`);
  }

  return {
    startTime: new Date().toISOString(),
    startTimeMs: Date.now(),
  };
}

export function teardown(data) {
  const durationMinutes = ((Date.now() - data.startTimeMs) / 60000).toFixed(2);

  console.log('='.repeat(60));
  console.log('SOAK TEST COMPLETED');
  console.log('='.repeat(60));
  console.log(`Started: ${data.startTime}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log(`Duration: ${durationMinutes} minutes`);
  console.log('='.repeat(60));
  console.log('Review metrics for signs of degradation over time:');
  console.log('- response_time_over_time: Should remain stable');
  console.log('- memory_indicator: Should remain low');
  console.log('- errors: Should remain near 0');
  console.log('='.repeat(60));
}

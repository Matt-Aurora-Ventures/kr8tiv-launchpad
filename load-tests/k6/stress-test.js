/**
 * K6 Stress Test
 *
 * Tests the API's behavior under extreme load conditions.
 * Identifies the breaking point and recovery characteristics.
 *
 * Stages:
 * 1. Ramp to 500 VUs over 2 minutes
 * 2. Stay at 500 VUs for 5 minutes
 * 3. Push to 1000 VUs over 2 minutes
 * 4. Stay at 1000 VUs for 5 minutes
 * 5. Ramp down over 2 minutes
 *
 * Run: k6 run --env API_URL=http://localhost:3001 load-tests/k6/stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, randomItem, randomWallet, defaultHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '2m', target: 500 },   // Ramp to 500 VUs
    { duration: '5m', target: 500 },   // Stay at 500
    { duration: '2m', target: 1000 },  // Push to 1000 VUs
    { duration: '5m', target: 1000 },  // Stay at 1000
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    // Under stress, we relax thresholds but still have limits
    http_req_duration: ['p(95)<2000'],     // 95% under 2 seconds
    http_req_failed: ['rate<0.10'],        // Less than 10% failure rate
    http_reqs: ['rate>100'],               // At least 100 req/s throughput
  },
  tags: {
    testType: 'stress',
  },
};

// Custom metrics for stress test
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const requestDuration = new Trend('request_duration');
const requestsPerSecond = new Counter('requests_total');
const timeouts = new Counter('timeouts');
const serverErrors = new Counter('server_errors');

// Endpoints to test (weighted by typical usage)
const endpoints = [
  { path: '/api/tokens', weight: 30 },
  { path: '/api/tokens/recent', weight: 20 },
  { path: '/api/tokens/top', weight: 15 },
  { path: '/api/staking/pool', weight: 15 },
  { path: '/api/stats/platform', weight: 10 },
  { path: '/api/stats/trending', weight: 10 },
];

// Select endpoint based on weight
function selectEndpoint() {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const endpoint of endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint.path;
    }
  }
  return endpoints[0].path;
}

export default function() {
  const baseUrl = config.apiUrl;

  group('Stress Test Requests', () => {
    // Select a random endpoint based on weights
    const endpoint = selectEndpoint();

    const startTime = new Date();
    const res = http.get(`${baseUrl}${endpoint}`, {
      headers: defaultHeaders,
      timeout: '10s', // Longer timeout for stress test
    });
    const duration = new Date() - startTime;

    requestsPerSecond.add(1);
    requestDuration.add(duration);

    // Check for timeout
    if (res.status === 0) {
      timeouts.add(1);
      errorRate.add(true);
      successRate.add(false);
      return;
    }

    // Check for server errors
    if (res.status >= 500) {
      serverErrors.add(1);
      errorRate.add(true);
      successRate.add(false);
      return;
    }

    // Check success
    const isSuccess = check(res, {
      'status is 2xx or 4xx': (r) => r.status >= 200 && r.status < 500,
      'response time under 5s': (r) => r.timings.duration < 5000,
    });

    errorRate.add(!isSuccess);
    successRate.add(isSuccess);

    // Minimal think time under stress
    sleep(0.1);
  });

  // Additional stress patterns
  if (Math.random() < 0.3) {
    // 30% chance of rapid-fire requests
    group('Burst Requests', () => {
      const burstEndpoints = [
        '/api/tokens',
        '/api/stats/platform',
        '/api/staking/pool',
      ];

      for (const path of burstEndpoints) {
        const res = http.get(`${baseUrl}${path}`, {
          headers: defaultHeaders,
          timeout: '5s',
        });

        requestsPerSecond.add(1);

        if (res.status >= 500 || res.status === 0) {
          errorRate.add(true);
        } else {
          errorRate.add(false);
        }
      }
    });
  }

  if (Math.random() < 0.2) {
    // 20% chance of wallet-specific requests
    group('Wallet Requests', () => {
      const wallet = randomItem(config.testWallets);

      const statusRes = http.get(`${baseUrl}/api/staking/status/${wallet}`, {
        headers: defaultHeaders,
        timeout: '5s',
      });

      requestsPerSecond.add(1);
      errorRate.add(statusRes.status >= 500 || statusRes.status === 0);

      const creatorRes = http.get(`${baseUrl}/api/stats/creator/${wallet}`, {
        headers: defaultHeaders,
        timeout: '5s',
      });

      requestsPerSecond.add(1);
      errorRate.add(creatorRes.status >= 500 || creatorRes.status === 0);
    });
  }
}

export function setup() {
  console.log('='.repeat(60));
  console.log('STRESS TEST STARTING');
  console.log('='.repeat(60));
  console.log(`Target: ${config.apiUrl}`);
  console.log('Warning: This test will push your API to its limits!');
  console.log('='.repeat(60));

  // Pre-flight check
  const healthRes = http.get(`${config.apiUrl}/health`, {
    timeout: '5s',
  });

  if (healthRes.status !== 200) {
    console.error(`API health check failed: ${healthRes.status}`);
  } else {
    console.log('API health check passed');
  }

  return {
    startTime: new Date().toISOString(),
  };
}

export function teardown(data) {
  console.log('='.repeat(60));
  console.log('STRESS TEST COMPLETED');
  console.log('='.repeat(60));
  console.log(`Started: ${data.startTime}`);
  console.log(`Finished: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

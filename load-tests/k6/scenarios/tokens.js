/**
 * K6 Load Test - Token Endpoints
 *
 * Tests the token listing and detail endpoints:
 * - GET /api/tokens - List all tokens
 * - GET /api/tokens/:mint - Get token details
 * - GET /api/tokens/:mint/stats - Get token statistics
 * - GET /api/tokens/:mint/holders - Get token holders
 * - GET /api/tokens/:mint/chart - Get price chart data
 *
 * Run: k6 run --env API_URL=http://localhost:3001 load-tests/k6/scenarios/tokens.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { options as defaultOptions, config, randomItem, defaultHeaders } from '../config.js';

// Export options for K6
export const options = {
  ...defaultOptions,
  tags: {
    scenario: 'tokens',
  },
};

// Custom metrics
const tokenListSuccess = new Rate('token_list_success');
const tokenDetailSuccess = new Rate('token_detail_success');
const tokenListDuration = new Trend('token_list_duration');
const tokenDetailDuration = new Trend('token_detail_duration');
const tokensFound = new Counter('tokens_found');

// Store discovered tokens for reuse
let discoveredTokens = [];

export default function() {
  const baseUrl = config.apiUrl;

  group('Token Listing', () => {
    // Test: List all tokens
    const listRes = http.get(`${baseUrl}/api/tokens`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const listSuccess = check(listRes, {
      'list status 200': (r) => r.status === 200,
      'list has success flag': (r) => {
        try {
          return r.json().success === true;
        } catch {
          return false;
        }
      },
      'list has data array': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'list response time < 500ms': (r) => r.timings.duration < 500,
    });

    tokenListSuccess.add(listSuccess);
    tokenListDuration.add(listRes.timings.duration);

    // Extract tokens for subsequent requests
    if (listRes.status === 200) {
      try {
        const data = listRes.json().data;
        if (Array.isArray(data) && data.length > 0) {
          discoveredTokens = data.slice(0, 10).map(t => t.mint).filter(Boolean);
          tokensFound.add(data.length);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    sleep(0.5);

    // Test: List with pagination
    const paginatedRes = http.get(`${baseUrl}/api/tokens?limit=10&offset=0`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(paginatedRes, {
      'paginated list status 200': (r) => r.status === 200,
      'paginated response time < 300ms': (r) => r.timings.duration < 300,
    });

    sleep(0.5);

    // Test: List recent tokens
    const recentRes = http.get(`${baseUrl}/api/tokens/recent`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(recentRes, {
      'recent tokens status 200': (r) => r.status === 200,
      'recent tokens response time < 300ms': (r) => r.timings.duration < 300,
    });

    sleep(0.5);

    // Test: List top tokens
    const topRes = http.get(`${baseUrl}/api/tokens/top`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(topRes, {
      'top tokens status 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // Test: List graduated tokens
    const graduatedRes = http.get(`${baseUrl}/api/tokens/graduated`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(graduatedRes, {
      'graduated tokens status 200': (r) => r.status === 200,
    });
  });

  group('Token Details', () => {
    // Use discovered tokens or fallback to test mints
    const tokensToTest = discoveredTokens.length > 0
      ? discoveredTokens
      : config.testMints;

    const mint = randomItem(tokensToTest);

    // Test: Get token details
    const detailRes = http.get(`${baseUrl}/api/tokens/${mint}`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const detailSuccess = check(detailRes, {
      'detail status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'detail has success flag': (r) => {
        try {
          return typeof r.json().success === 'boolean';
        } catch {
          return false;
        }
      },
      'detail response time < 500ms': (r) => r.timings.duration < 500,
    });

    tokenDetailSuccess.add(detailSuccess);
    tokenDetailDuration.add(detailRes.timings.duration);

    sleep(0.5);

    // Test: Get token stats
    const statsRes = http.get(`${baseUrl}/api/tokens/${mint}/stats`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(statsRes, {
      'stats status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'stats response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.5);

    // Test: Get token holders
    const holdersRes = http.get(`${baseUrl}/api/tokens/${mint}/holders`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(holdersRes, {
      'holders status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'holders response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    sleep(0.5);

    // Test: Get token chart data
    const chartRes = http.get(`${baseUrl}/api/tokens/${mint}/chart?interval=1h`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(chartRes, {
      'chart status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'chart response time < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  // Small delay between iterations
  sleep(1);
}

// Setup function - runs once at the start
export function setup() {
  console.log(`Starting token load test against ${config.apiUrl}`);

  // Verify API is reachable
  const healthRes = http.get(`${config.apiUrl}/health`, {
    timeout: '5s',
  });

  if (healthRes.status !== 200) {
    console.warn(`Warning: Health check returned status ${healthRes.status}`);
  }

  return {
    startTime: new Date().toISOString(),
  };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log(`Token load test completed. Started at ${data.startTime}`);
}

/**
 * K6 Load Test - Stats Endpoints
 *
 * Tests the statistics endpoints:
 * - GET /api/stats/platform - Platform-wide statistics
 * - GET /api/stats/creator/:wallet - Creator statistics
 * - GET /api/stats/trending - Trending tokens
 * - GET /api/stats/new - Newly launched tokens
 * - GET /api/stats/automation - Automation statistics
 *
 * Run: k6 run --env API_URL=http://localhost:3001 load-tests/k6/scenarios/stats.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { options as defaultOptions, config, randomItem, randomWallet, defaultHeaders } from '../config.js';

// Export options for K6
export const options = {
  ...defaultOptions,
  tags: {
    scenario: 'stats',
  },
};

// Custom metrics
const platformStatsSuccess = new Rate('platform_stats_success');
const creatorStatsSuccess = new Rate('creator_stats_success');
const trendingSuccess = new Rate('trending_success');
const platformStatsDuration = new Trend('platform_stats_duration');
const trendingDuration = new Trend('trending_duration');

export default function() {
  const baseUrl = config.apiUrl;

  group('Platform Stats', () => {
    // Test: Get overall platform statistics
    const platformRes = http.get(`${baseUrl}/api/stats/platform`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const platformSuccess = check(platformRes, {
      'platform status 200': (r) => r.status === 200,
      'platform has success flag': (r) => {
        try {
          return r.json().success === true;
        } catch {
          return false;
        }
      },
      'platform has data': (r) => {
        try {
          return r.json().data !== undefined;
        } catch {
          return false;
        }
      },
      'platform response time < 500ms': (r) => r.timings.duration < 500,
    });

    platformStatsSuccess.add(platformSuccess);
    platformStatsDuration.add(platformRes.timings.duration);

    sleep(0.5);

    // Test: Automation stats
    const automationRes = http.get(`${baseUrl}/api/stats/automation`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(automationRes, {
      'automation stats status 200': (r) => r.status === 200,
      'automation stats response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  group('Creator Stats', () => {
    // Test with known test wallets
    const wallet = randomItem(config.testWallets);

    const creatorRes = http.get(`${baseUrl}/api/stats/creator/${wallet}`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const creatorSuccess = check(creatorRes, {
      'creator status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'creator has success flag': (r) => {
        try {
          return typeof r.json().success === 'boolean';
        } catch {
          return false;
        }
      },
      'creator response time < 500ms': (r) => r.timings.duration < 500,
    });

    creatorStatsSuccess.add(creatorSuccess);

    sleep(0.5);

    // Test with random wallet (likely no data)
    const randomAddr = randomWallet();

    const randomCreatorRes = http.get(`${baseUrl}/api/stats/creator/${randomAddr}`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(randomCreatorRes, {
      'random creator status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'random creator response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  group('Trending & New Tokens', () => {
    // Test: Get trending tokens
    const trendingRes = http.get(`${baseUrl}/api/stats/trending`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const trendSuccess = check(trendingRes, {
      'trending status 200': (r) => r.status === 200,
      'trending has data array': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'trending response time < 500ms': (r) => r.timings.duration < 500,
    });

    trendingSuccess.add(trendSuccess);
    trendingDuration.add(trendingRes.timings.duration);

    sleep(0.5);

    // Test: Get new tokens
    const newTokensRes = http.get(`${baseUrl}/api/stats/new`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(newTokensRes, {
      'new tokens status 200': (r) => r.status === 200,
      'new tokens has data': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'new tokens response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.5);

    // Test: Trending with limit
    const trendingLimitedRes = http.get(`${baseUrl}/api/stats/trending?limit=5`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(trendingLimitedRes, {
      'trending limited status 200': (r) => r.status === 200,
      'trending limited response time < 400ms': (r) => r.timings.duration < 400,
    });
  });

  // Small delay between iterations
  sleep(1);
}

// Setup function
export function setup() {
  console.log(`Starting stats load test against ${config.apiUrl}`);

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

// Teardown function
export function teardown(data) {
  console.log(`Stats load test completed. Started at ${data.startTime}`);
}

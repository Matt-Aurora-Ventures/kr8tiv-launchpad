/**
 * K6 Load Test - Staking Endpoints
 *
 * Tests the staking-related endpoints:
 * - GET /api/staking/pool - Get staking pool info
 * - GET /api/staking/tiers - Get staking tiers
 * - GET /api/staking/status/:wallet - Get wallet staking status
 * - GET /api/staking/leaderboard - Get staking leaderboard
 *
 * Note: POST endpoints (stake, unstake, claim) are not tested
 * as they require wallet signatures and would modify state.
 *
 * Run: k6 run --env API_URL=http://localhost:3001 load-tests/k6/scenarios/staking.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { options as defaultOptions, config, randomItem, randomWallet, defaultHeaders } from '../config.js';

// Export options for K6
export const options = {
  ...defaultOptions,
  tags: {
    scenario: 'staking',
  },
};

// Custom metrics
const poolInfoSuccess = new Rate('pool_info_success');
const statusCheckSuccess = new Rate('status_check_success');
const poolInfoDuration = new Trend('pool_info_duration');
const statusCheckDuration = new Trend('status_check_duration');
const leaderboardDuration = new Trend('leaderboard_duration');

export default function() {
  const baseUrl = config.apiUrl;

  group('Staking Pool Info', () => {
    // Test: Get staking pool info
    const poolRes = http.get(`${baseUrl}/api/staking/pool`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const poolSuccess = check(poolRes, {
      'pool status 200': (r) => r.status === 200,
      'pool has success flag': (r) => {
        try {
          return r.json().success === true;
        } catch {
          return false;
        }
      },
      'pool has data': (r) => {
        try {
          return r.json().data !== undefined;
        } catch {
          return false;
        }
      },
      'pool response time < 300ms': (r) => r.timings.duration < 300,
    });

    poolInfoSuccess.add(poolSuccess);
    poolInfoDuration.add(poolRes.timings.duration);

    sleep(0.5);

    // Test: Get staking tiers
    const tiersRes = http.get(`${baseUrl}/api/staking/tiers`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(tiersRes, {
      'tiers status 200': (r) => r.status === 200,
      'tiers has data array': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'tiers response time < 300ms': (r) => r.timings.duration < 300,
    });
  });

  group('Staking Status', () => {
    // Test with known test wallets
    const wallet = randomItem(config.testWallets);

    const statusRes = http.get(`${baseUrl}/api/staking/status/${wallet}`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const statusSuccess = check(statusRes, {
      'status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'status has success flag': (r) => {
        try {
          return typeof r.json().success === 'boolean';
        } catch {
          return false;
        }
      },
      'status response time < 500ms': (r) => r.timings.duration < 500,
    });

    statusCheckSuccess.add(statusSuccess);
    statusCheckDuration.add(statusRes.timings.duration);

    sleep(0.5);

    // Test with random wallet (likely not staked)
    const randomAddr = randomWallet();

    const randomStatusRes = http.get(`${baseUrl}/api/staking/status/${randomAddr}`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(randomStatusRes, {
      'random wallet status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'random wallet response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  group('Staking Leaderboard', () => {
    // Test: Get leaderboard
    const leaderboardRes = http.get(`${baseUrl}/api/staking/leaderboard`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(leaderboardRes, {
      'leaderboard status 200': (r) => r.status === 200,
      'leaderboard has data': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'leaderboard response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    leaderboardDuration.add(leaderboardRes.timings.duration);

    sleep(0.5);

    // Test: Get leaderboard with limit
    const limitedRes = http.get(`${baseUrl}/api/staking/leaderboard?limit=10`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(limitedRes, {
      'limited leaderboard status 200': (r) => r.status === 200,
      'limited leaderboard response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  // Small delay between iterations
  sleep(1);
}

// Setup function
export function setup() {
  console.log(`Starting staking load test against ${config.apiUrl}`);

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
  console.log(`Staking load test completed. Started at ${data.startTime}`);
}

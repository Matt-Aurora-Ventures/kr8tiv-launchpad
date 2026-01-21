/**
 * K6 Load Test - Launch Endpoints (Read-Only)
 *
 * Tests the launch-related endpoints (GET only):
 * - GET /api/tokens - List all tokens
 * - GET /api/tokens/recent - Get recently launched tokens
 * - GET /api/tokens/graduated - Get graduated tokens
 * - GET /api/tokens/top - Get top tokens by volume
 *
 * Note: POST /api/launch is NOT tested as it would:
 * 1. Require wallet signatures
 * 2. Actually launch tokens (costly/irreversible)
 * 3. Be rate limited heavily
 *
 * Run: k6 run --env API_URL=http://localhost:3001 load-tests/k6/scenarios/launch.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { options as defaultOptions, config, defaultHeaders } from '../config.js';

// Export options for K6
export const options = {
  ...defaultOptions,
  tags: {
    scenario: 'launch',
  },
};

// Custom metrics
const listTokensSuccess = new Rate('list_tokens_success');
const recentTokensSuccess = new Rate('recent_tokens_success');
const graduatedTokensSuccess = new Rate('graduated_tokens_success');
const topTokensSuccess = new Rate('top_tokens_success');
const listDuration = new Trend('list_duration');
const totalTokensReturned = new Counter('total_tokens_returned');

export default function() {
  const baseUrl = config.apiUrl;

  group('Token Listings', () => {
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
      'list has data': (r) => {
        try {
          const data = r.json().data;
          return Array.isArray(data);
        } catch {
          return false;
        }
      },
      'list response time < 500ms': (r) => r.timings.duration < 500,
    });

    listTokensSuccess.add(listSuccess);
    listDuration.add(listRes.timings.duration);

    if (listRes.status === 200) {
      try {
        const data = listRes.json().data;
        if (Array.isArray(data)) {
          totalTokensReturned.add(data.length);
        }
      } catch {
        // Ignore
      }
    }

    sleep(0.5);

    // Test: List with various pagination options
    const paginationTests = [
      { limit: 10, offset: 0 },
      { limit: 20, offset: 10 },
      { limit: 50, offset: 0 },
    ];

    for (const params of paginationTests) {
      const paginatedRes = http.get(
        `${baseUrl}/api/tokens?limit=${params.limit}&offset=${params.offset}`,
        {
          headers: defaultHeaders,
          timeout: config.timeout,
        }
      );

      check(paginatedRes, {
        [`paginated (limit=${params.limit}) status 200`]: (r) => r.status === 200,
        [`paginated (limit=${params.limit}) response time < 400ms`]: (r) => r.timings.duration < 400,
      });

      sleep(0.3);
    }
  });

  group('Recent Tokens', () => {
    // Test: Get recently launched tokens
    const recentRes = http.get(`${baseUrl}/api/tokens/recent`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const recentSuccess = check(recentRes, {
      'recent status 200': (r) => r.status === 200,
      'recent has data array': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'recent response time < 400ms': (r) => r.timings.duration < 400,
    });

    recentTokensSuccess.add(recentSuccess);

    sleep(0.5);

    // Test: Recent with limit
    const recentLimitedRes = http.get(`${baseUrl}/api/tokens/recent?limit=5`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    check(recentLimitedRes, {
      'recent limited status 200': (r) => r.status === 200,
      'recent limited response time < 300ms': (r) => r.timings.duration < 300,
    });
  });

  group('Graduated Tokens', () => {
    // Test: Get graduated tokens (tokens that passed bonding curve)
    const graduatedRes = http.get(`${baseUrl}/api/tokens/graduated`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const graduatedSuccess = check(graduatedRes, {
      'graduated status 200': (r) => r.status === 200,
      'graduated has data': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'graduated response time < 500ms': (r) => r.timings.duration < 500,
    });

    graduatedTokensSuccess.add(graduatedSuccess);
  });

  group('Top Tokens', () => {
    // Test: Get top tokens by volume
    const topRes = http.get(`${baseUrl}/api/tokens/top`, {
      headers: defaultHeaders,
      timeout: config.timeout,
    });

    const topSuccess = check(topRes, {
      'top status 200': (r) => r.status === 200,
      'top has data': (r) => {
        try {
          return Array.isArray(r.json().data);
        } catch {
          return false;
        }
      },
      'top response time < 500ms': (r) => r.timings.duration < 500,
    });

    topTokensSuccess.add(topSuccess);

    sleep(0.5);

    // Test: Top with different timeframes
    const timeframes = ['24h', '7d', '30d'];

    for (const timeframe of timeframes) {
      const timeframeRes = http.get(`${baseUrl}/api/tokens/top?timeframe=${timeframe}`, {
        headers: defaultHeaders,
        timeout: config.timeout,
      });

      check(timeframeRes, {
        [`top ${timeframe} status 200`]: (r) => r.status === 200,
        [`top ${timeframe} response time < 500ms`]: (r) => r.timings.duration < 500,
      });

      sleep(0.3);
    }
  });

  // Small delay between iterations
  sleep(1);
}

// Setup function
export function setup() {
  console.log(`Starting launch endpoints load test against ${config.apiUrl}`);

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
  console.log(`Launch endpoints load test completed. Started at ${data.startTime}`);
}

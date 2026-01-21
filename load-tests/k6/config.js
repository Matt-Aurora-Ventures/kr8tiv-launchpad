/**
 * K6 Load Test Configuration
 *
 * Shared configuration for all K6 load test scenarios.
 * Import this in your test files to use consistent settings.
 */

// Default load test options - gradual ramp up with spike test
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 200 },  // Spike to 200 users
    { duration: '1m', target: 100 },   // Back to 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

// Smoke test - quick sanity check
export const smokeOptions = {
  stages: [
    { duration: '10s', target: 5 },    // Ramp to 5 users
    { duration: '30s', target: 5 },    // Stay at 5
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<300'],  // 99% under 300ms
    http_req_failed: ['rate<0.001'],   // Less than 0.1% failures
  },
};

// Configuration constants
export const config = {
  // Base URL - override with K6_API_URL environment variable
  apiUrl: __ENV.API_URL || 'http://localhost:3001',

  // Sample wallet addresses for testing
  testWallets: [
    'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    'FwfrwnNVLGyS8ucVjWvyoRdpEVTdBqkCQHWLNK2pwKjc',
    'HWHvQhFmJB6gPtqJx3gjxHX1iDKLezLPEqK5EBzDYBGh',
  ],

  // Sample token mints for testing
  testMints: [
    'So11111111111111111111111111111111111111112',  // wSOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
  ],

  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Request timeouts
  timeout: '30s',
};

// Helper function to get random item from array
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random wallet-like string
export function randomWallet() {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Default headers for API requests
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

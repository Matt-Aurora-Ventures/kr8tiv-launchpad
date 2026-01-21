# KR8TIV Launchpad - Load Testing

This directory contains load testing infrastructure for the KR8TIV Launchpad API using both [K6](https://k6.io/) and [Artillery](https://artillery.io/).

## Quick Start

### Prerequisites

**K6:**
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Artillery:**
```bash
npm install -g artillery artillery-plugin-expect
```

### Run Tests

```bash
# Start your API first
npm run api:dev

# Run K6 token tests
./load-tests/run-k6.sh tokens

# Run Artillery standard test
./load-tests/run-artillery.sh standard
```

## Directory Structure

```
load-tests/
├── k6/
│   ├── config.js           # Shared K6 configuration
│   ├── scenarios/
│   │   ├── tokens.js       # Token endpoint tests
│   │   ├── staking.js      # Staking endpoint tests
│   │   ├── launch.js       # Launch endpoint tests (read-only)
│   │   └── stats.js        # Stats endpoint tests
│   ├── stress-test.js      # Stress test (high load)
│   └── soak-test.js        # Soak test (long duration)
├── artillery/
│   ├── config.yml          # Standard load test config
│   └── stress.yml          # Stress test config
├── run-k6.sh               # K6 runner script
├── run-artillery.sh        # Artillery runner script
└── README.md               # This file
```

## Test Types

### 1. Smoke Test
Quick sanity check with minimal load.
- Duration: ~1 minute
- VUs: 5
- Purpose: Verify API is functioning

```bash
k6 run --vus 5 --duration 30s load-tests/k6/scenarios/tokens.js
```

### 2. Load Test (Standard)
Normal load testing with gradual ramp-up.
- Duration: ~4 minutes
- VUs: 20 → 100 → 200 → 100 → 0
- Purpose: Verify performance under expected load

```bash
./load-tests/run-k6.sh tokens
# or
./load-tests/run-artillery.sh standard
```

### 3. Stress Test
Push the API to its limits.
- Duration: ~16 minutes
- VUs: 500 → 1000
- Purpose: Find breaking points

```bash
./load-tests/run-k6.sh stress
# or
./load-tests/run-artillery.sh stress
```

### 4. Soak Test
Extended duration test for memory leaks.
- Duration: ~1 hour
- VUs: 100 (sustained)
- Purpose: Identify degradation over time

```bash
./load-tests/run-k6.sh soak
```

## K6 Scenarios

### tokens.js
Tests token-related endpoints:
- `GET /api/tokens` - List all tokens
- `GET /api/tokens/recent` - Recent tokens
- `GET /api/tokens/top` - Top tokens
- `GET /api/tokens/:mint` - Token details
- `GET /api/tokens/:mint/stats` - Token statistics
- `GET /api/tokens/:mint/holders` - Token holders
- `GET /api/tokens/:mint/chart` - Price chart

### staking.js
Tests staking-related endpoints:
- `GET /api/staking/pool` - Pool info
- `GET /api/staking/tiers` - Staking tiers
- `GET /api/staking/status/:wallet` - Wallet status
- `GET /api/staking/leaderboard` - Leaderboard

### launch.js
Tests launch/listing endpoints (read-only):
- `GET /api/tokens` - All tokens
- `GET /api/tokens/recent` - Recent launches
- `GET /api/tokens/graduated` - Graduated tokens
- `GET /api/tokens/top` - Top by volume

### stats.js
Tests statistics endpoints:
- `GET /api/stats/platform` - Platform stats
- `GET /api/stats/creator/:wallet` - Creator stats
- `GET /api/stats/trending` - Trending tokens
- `GET /api/stats/new` - New tokens
- `GET /api/stats/automation` - Automation stats

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Target API URL | `http://localhost:3001` |
| `K6_CLOUD_TOKEN` | K6 Cloud token (optional) | - |

### K6 Options

Override default options in `config.js`:

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    // ...
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};
```

### Thresholds

Default performance thresholds:

| Metric | Load Test | Stress Test | Soak Test |
|--------|-----------|-------------|-----------|
| p95 response time | < 500ms | < 2000ms | < 1000ms |
| Error rate | < 1% | < 10% | < 1% |
| p99 response time | - | - | < 2000ms |

## Running in CI

Load tests run automatically:
- **Weekly** (Sunday 4 AM UTC) via GitHub Actions
- **On-demand** via workflow_dispatch

### Manual Trigger

1. Go to Actions → Load Tests
2. Click "Run workflow"
3. Select scenario and environment
4. Click "Run workflow"

### Secrets Required

Configure these in GitHub repository settings:
- `STAGING_API_URL` - Staging API endpoint
- `PRODUCTION_API_URL` - Production API endpoint (optional)

## Interpreting Results

### K6 Output

```
     ✓ list status 200
     ✓ list has data

     checks.........................: 100.00% ✓ 1234     ✗ 0
     data_received..................: 12 MB   200 kB/s
     data_sent......................: 1.2 MB  20 kB/s
     http_req_duration..............: avg=45ms min=10ms max=500ms p(95)=120ms
     http_reqs......................: 1234    20/s
     iteration_duration.............: avg=1.2s min=1s   max=2s
```

Key metrics:
- **http_req_duration**: Response time (watch p95)
- **http_req_failed**: Error rate (should be near 0)
- **http_reqs**: Throughput (requests per second)

### Artillery Output

```
Summary report @ 15:00:00
  Scenarios launched: 1000
  Scenarios completed: 1000
  Requests completed: 5000
  Mean response time: 45ms
  95th percentile: 120ms
  99th percentile: 250ms
  RPS: 100
```

## Best Practices

1. **Always run against staging first** - Never load test production without approval
2. **Start small** - Run smoke tests before full load tests
3. **Monitor during tests** - Watch server metrics (CPU, memory, DB connections)
4. **Review baselines** - Compare against previous results
5. **Test in isolation** - Avoid testing during deployments or maintenance

## Troubleshooting

### "Connection refused" errors
- Ensure the API is running
- Check the API_URL is correct
- Verify no firewall is blocking connections

### High error rates
- Check API logs for errors
- Verify database connections
- Check rate limiting settings

### Tests timing out
- Increase timeout in config
- Check if API is under too much load
- Review server resources

## Adding New Tests

1. Create a new scenario file in `k6/scenarios/`
2. Import shared config: `import { options, config } from '../config.js'`
3. Define your test function
4. Add to runner script if needed

Example:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { options, config, defaultHeaders } from '../config.js';

export { options };

export default function() {
  const res = http.get(`${config.apiUrl}/api/your-endpoint`, {
    headers: defaultHeaders,
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

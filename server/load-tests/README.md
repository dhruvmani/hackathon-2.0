# k6 Load Tests

This directory contains k6 load testing scripts for the Netflix Clone application.

## Prerequisites

- [k6](https://k6.io/) installed locally OR [Docker](https://www.docker.com/)

## Test Scenarios

### 1. Normal Baseline
Simulates 10 concurrent users for 30 seconds.

**For Linux/macOS:**
```bash
docker run --rm -v "${PWD}:/scripts" -i --network=host grafana/k6 run /scripts/load-tests/baseline.js
```

**For Windows (Git Bash):**
```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "/$(pwd):/scripts" -i --network=host grafana/k6 run /scripts/load-tests/baseline.js
```

### 2. Spike Test
Simulates a rapid traffic spike from 10 to 200 users.
```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "/$(pwd):/scripts" -i --network=host grafana/k6 run /scripts/load-tests/spike.js
```

### 3. Full Load Test
Comprehensive test including authentication and mutations.
```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "/$(pwd):/scripts" -i --network=host grafana/k6 run /scripts/load-tests/full.js
```

### 4. Anomaly Load Test
Used in conjunction with anomaly injection to observe system degradation.
```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "/$(pwd):/scripts" -i --network=host grafana/k6 run /scripts/load-tests/anomaly-test.js
```

## How to use with Anomalies

1. **Enable anomaly**:
   ```bash
   curl -X POST http://localhost:4002/anomaly/set -H "Content-Type: application/json" -d '{"type":"slow-query"}'
   ```

2. **Run anomaly load test**:
   ```bash
   docker run --rm -i --network=host grafana/k6 run - < load-tests/anomaly-test.js
   ```

3. **Disable anomaly**:
   ```bash
   curl -X POST http://localhost:4002/anomaly/set -H "Content-Type: application/json" -d '{"type":"none"}'
   ```

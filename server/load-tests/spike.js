import { check, sleep } from 'k6';
import { gqlRequest } from './utils.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // warm up
    { duration: '15s', target: 200 },  // spike
    { duration: '30s', target: 200 },  // hold
    { duration: '10s', target: 10 },   // recovery
    { duration: '5s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

const GATEWAY_URL = 'http://localhost:8080/graphql';
const TEST_MOVIE_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

const MOVIES_QUERY = `
  query GetMovies($page: Int, $limit: Int) {
    movies(page: $page, limit: $limit) {
      movies { id title }
    }
  }
`;

export default function () {
  const res = gqlRequest(GATEWAY_URL, MOVIES_QUERY, { page: 1, limit: 10 });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.5);
}

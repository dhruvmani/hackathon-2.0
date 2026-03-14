import { check, sleep } from 'k6';
import { gqlRequest } from './utils.js';

export const options = {
  vus: 100,
  duration: '60s',
};

const GATEWAY_URL = 'http://localhost:8080/graphql';

const MOVIES_QUERY = `
  query GetMovies($page: Int, $limit: Int) {
    movies(page: $page, limit: $limit) {
      movies { id title }
    }
  }
`;

export default function () {
  // Purpose: show dashboard degradation during anomaly
  const res = gqlRequest(GATEWAY_URL, MOVIES_QUERY, { page: 1, limit: 10 });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}

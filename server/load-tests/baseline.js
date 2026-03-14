import { check, sleep } from 'k6';
import { gqlRequest } from './utils.js';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

const GATEWAY_URL = 'http://localhost:8080/graphql';

// Operations:
// 1. movies(page:1, limit:10)
// 2. movie(id)
// 3. reviewsByMovie(movieId)

const MOVIES_QUERY = `
  query GetMovies($page: Int, $limit: Int) {
    movies(page: $page, limit: $limit) {
      movies { id title }
    }
  }
`;

const MOVIE_QUERY = `
  query GetMovie($id: ID!) {
    movie(id: $id) {
      id title description
    }
  }
`;

const REVIEWS_QUERY = `
  query GetReviews($movieId: ID!) {
    reviewsByMovie(movieId: $movieId) {
      id rating comment
    }
  }
`;

// Hardcoded movie ID from seed
const TEST_MOVIE_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

export default function () {
  const op = Math.floor(Math.random() * 3);
  let res;

  if (op === 0) {
    res = gqlRequest(GATEWAY_URL, MOVIES_QUERY, { page: 1, limit: 10 });
    check(res, { 'movies status is 200': (r) => r.status === 200 });
  } else if (op === 1) {
    res = gqlRequest(GATEWAY_URL, MOVIE_QUERY, { id: TEST_MOVIE_ID });
    check(res, { 'movie status is 200': (r) => r.status === 200 });
  } else {
    res = gqlRequest(GATEWAY_URL, REVIEWS_QUERY, { movieId: TEST_MOVIE_ID });
    check(res, { 'reviews status is 200': (r) => r.status === 200 });
  }

  sleep(1);
}

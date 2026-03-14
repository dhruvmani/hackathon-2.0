import { check, sleep } from 'k6';
import { gqlRequest } from './utils.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '60s', target: 100 },
    { duration: '60s', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.02'],
  },
};

const GATEWAY_URL = 'http://localhost:8080/graphql';
const TEST_MOVIE_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id }
    }
  }
`;

const POST_REVIEW_MUTATION = `
  mutation PostReview($movieId: ID!, $rating: Int!, $comment: String!) {
    postReview(movieId: $movieId, rating: $rating, comment: $comment) {
      id
    }
  }
`;

export function setup() {
  const loginRes = gqlRequest(GATEWAY_URL, LOGIN_MUTATION, {
    email: 'admin@netflix.com',
    password: 'password123',
  });

  const data = loginRes.json();
  if (!data || !data.data || !data.data.login) {
    throw new Error('Setup: Login failed');
  }

  return {
    token: data.data.login.token,
    movieId: TEST_MOVIE_ID,
  };
}

export default function (data) {
  const op = Math.floor(Math.random() * 5);
  let res;

  if (op === 0) {
    res = gqlRequest(GATEWAY_URL, LOGIN_MUTATION, {
      email: 'admin@netflix.com',
      password: 'password123',
    });
    check(res, { 'login status is 200': (r) => r.status === 200 });
  } else if (op === 1) {
    res = gqlRequest(GATEWAY_URL, POST_REVIEW_MUTATION, {
      movieId: data.movieId,
      rating: 5,
      comment: 'Excellent movie from load test!',
    }, data.token);
    check(res, { 'postReview status is 200': (r) => r.status === 200 });
  } else {
    // 3 out of 5 are queries
    res = gqlRequest(GATEWAY_URL, '{ movies(page:1, limit:10) { total } }');
    check(res, { 'query status is 200': (r) => r.status === 200 });
  }

  sleep(0.1);
}

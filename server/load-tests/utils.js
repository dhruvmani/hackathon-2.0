import http from 'k6/http';

/**
 * Helper to build GraphQL request
 * @param {string} url - GraphQL endpoint URL
 * @param {string} query - GraphQL query/mutation string
 * @param {object} variables - Variables for the query
 * @param {string} token - Optional JWT token
 */
export function gqlRequest(url, query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const payload = JSON.stringify({
    query: query,
    variables: variables,
  });

  return http.post(url, payload, { headers });
}

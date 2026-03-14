import jwt from 'jsonwebtoken';

/**
 * Signs a JWT token with the given payload.
 * @param {object} payload - Data to encode in the token.
 * @param {string} secret - JWT secret key.
 * @param {string} expiresIn - Token expiry duration (e.g. "7d").
 * @returns {string} Signed JWT token.
 */
export function signToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * @param {string} token - JWT token string.
 * @param {string} secret - JWT secret key.
 * @returns {object} Decoded payload.
 */
export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

/**
 * Extracts the Bearer token from an Authorization header value.
 * @param {string} authHeader - The Authorization header value.
 * @returns {string|null} The token string or null if not present.
 */
export function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

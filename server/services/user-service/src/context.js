import { verifyToken, extractBearerToken } from '@netflix-clone/shared/jwtUtils';

/**
 * Builds the Apollo context from the incoming Express request.
 * Decodes the JWT if present — never throws, resolvers handle auth enforcement.
 *
 * @param {{ req: import('express').Request }} param0
 * @returns {{ userId: string|null, userRole: string|null }}
 */
export function buildContext({ req }) {
  // Gateway forwards the decoded user id as a header after verifying the JWT.
  // When hitting the subgraph directly (e.g. dev/testing), fall back to
  // decoding the Authorization header ourselves.
  const forwardedId = req.headers['x-user-id'];
  if (forwardedId) {
    return { userId: forwardedId, userRole: req.headers['x-user-role'] || null };
  }

  const token = extractBearerToken(req.headers.authorization);
  if (!token) return { userId: null, userRole: null };

  try {
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    return { userId: decoded.id, userRole: decoded.role };
  } catch {
    return { userId: null, userRole: null };
  }
}

import jwt from 'jsonwebtoken';

/**
 * Decodes the JWT from the Authorization header.
 * Never throws — returns null on any failure so subgraphs decide per-operation.
 *
 * @param {string|undefined} authHeader
 * @returns {{ id: string, role: string }|null}
 */
export function decodeToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { id: decoded.id, role: decoded.role };
  } catch {
    return null;
  }
}

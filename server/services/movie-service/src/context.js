/**
 * Builds Apollo context from the incoming Express request.
 * Reads x-user-id forwarded by the gateway.
 *
 * @param {{ req: import('express').Request }} param0
 * @returns {{ userId: string|null }}
 */
export function buildContext({ req }) {
  return {
    userId: req.headers['x-user-id'] || null,
    userRole: req.headers['x-user-role'] || null,
  };
}

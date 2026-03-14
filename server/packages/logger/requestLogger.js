/**
 * Express middleware that emits a structured log for every HTTP request.
 *
 * @param {import('winston').Logger} logger - A logger built with buildLogger().
 * @returns {import('express').RequestHandler}
 */
export function createRequestLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        userId: req.headers['x-user-id'] || null,
      });
    });

    next();
  };
}

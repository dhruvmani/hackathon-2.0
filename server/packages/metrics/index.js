import pkg from 'prom-client';
const { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } = pkg;

// One shared registry per process
const registry = new Registry();

// ── 1. initMetrics ────────────────────────────────────────────────────────────

/**
 * Initialises default Node.js metrics with a service-scoped prefix.
 * Call once at service startup, before anything else.
 *
 * @param {string} serviceName
 * @returns {Registry}
 */
export function initMetrics(serviceName) {
  const prefix = serviceName.replace(/-/g, '_') + '_';
  collectDefaultMetrics({ register: registry, prefix });
  return registry;
}

// ── 2. httpMetricsMiddleware ──────────────────────────────────────────────────

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [registry],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

/**
 * Express middleware that records http_requests_total and
 * http_request_duration_seconds for every response.
 *
 * @param {string} serviceName
 * @returns {import('express').RequestHandler}
 */
export function httpMetricsMiddleware(serviceName) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
      const route = req.route?.path ?? req.path ?? 'unknown';
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
        service: serviceName,
      };
      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, durationSeconds);
    });
    next();
  };
}

// ── 3. createDbMetrics ────────────────────────────────────────────────────────

const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'MongoDB query duration in seconds',
  labelNames: ['collection', 'operation', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [registry],
});

const dbErrorsTotal = new Counter({
  name: 'db_errors_total',
  help: 'Total number of MongoDB query errors',
  labelNames: ['collection', 'operation', 'service'],
  registers: [registry],
});

/**
 * @param {string} serviceName
 * @returns {{ recordQuery: (collection: string, operation: string, durationSeconds: number, error?: Error) => void }}
 */
export function createDbMetrics(serviceName) {
  return {
    recordQuery(collection, operation, durationSeconds, error) {
      const labels = { collection, operation, service: serviceName };
      dbQueryDuration.observe(labels, durationSeconds);
      if (error) dbErrorsTotal.inc(labels);
    },
  };
}

// ── 4. createCacheMetrics ─────────────────────────────────────────────────────

const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['key_prefix', 'service'],
  registers: [registry],
});

const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['key_prefix', 'service'],
  registers: [registry],
});

/**
 * @param {string} serviceName
 * @returns {{ recordHit: (keyPrefix: string) => void, recordMiss: (keyPrefix: string) => void }}
 */
export function createCacheMetrics(serviceName) {
  return {
    recordHit(keyPrefix) {
      cacheHitsTotal.inc({ key_prefix: keyPrefix, service: serviceName });
    },
    recordMiss(keyPrefix) {
      cacheMissesTotal.inc({ key_prefix: keyPrefix, service: serviceName });
    },
  };
}

// ── 5. createResolverMetrics ──────────────────────────────────────────────────

const resolverDuration = new Histogram({
  name: 'graphql_resolver_duration_seconds',
  help: 'GraphQL resolver execution duration in seconds',
  labelNames: ['operation', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [registry],
});

/**
 * @param {string} serviceName
 * @returns {{ recordResolver: (operationName: string, durationSeconds: number) => void }}
 */
export function createResolverMetrics(serviceName) {
  return {
    recordResolver(operationName, durationSeconds) {
      resolverDuration.observe({ operation: operationName, service: serviceName }, durationSeconds);
    },
  };
}

// ── 6. dbConnectionsGauge ─────────────────────────────────────────────────────

const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active MongoDB connections',
  labelNames: ['service'],
  registers: [registry],
});

/**
 * Returns a gauge with inc/dec bound to the given service label.
 * Wire .inc() to mongoose 'connected' and .dec() to 'disconnected'.
 *
 * @param {string} serviceName
 * @returns {{ inc: () => void, dec: () => void }}
 */
export function dbConnectionsGauge(serviceName) {
  return {
    inc: () => dbConnectionsActive.inc({ service: serviceName }),
    dec: () => dbConnectionsActive.dec({ service: serviceName }),
  };
}

// ── 7. activeUsersGauge ───────────────────────────────────────────────────────

const activeUsersTotal = new Gauge({
  name: 'active_users_total',
  help: 'Number of currently active (logged-in) users',
  labelNames: ['service'],
  registers: [registry],
});

/**
 * @param {string} serviceName
 * @returns {{ inc: () => void, dec: () => void }}
 */
export function activeUsersGauge(serviceName) {
  return {
    inc: () => activeUsersTotal.inc({ service: serviceName }),
    dec: () => activeUsersTotal.dec({ service: serviceName }),
  };
}

// ── 8. metricsRoute ───────────────────────────────────────────────────────────

/**
 * Returns an Express router that serves GET /metrics in Prometheus text format.
 *
 * @param {Registry} reg - The registry returned by initMetrics (or the shared one).
 * @returns {import('express').Router}
 */
export function metricsRoute(reg = registry) {
  // Lazy import to avoid circular dep issues — express is a peer dep
  const router = { get: null, _handlers: [] };

  // Return a plain middleware function instead of a Router to avoid
  // needing express as a direct dep in this package
  return async (req, res, next) => {
    if (req.method === 'GET' && req.path === '/') {
      try {
        res.set('Content-Type', reg.contentType);
        res.end(await reg.metrics());
      } catch (err) {
        res.status(500).end(err.message);
      }
    } else {
      next();
    }
  };
}

export { registry };

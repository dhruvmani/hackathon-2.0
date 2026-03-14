import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

let _sdk = null;

/**
 * Initialises the OpenTelemetry NodeSDK for a given service.
 * Must be called before any other imports in the service entry point.
 *
 * @param {string} serviceName - Value for the service.name resource attribute.
 */
export function initTracing(serviceName) {
  const exporter = new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      'http://localhost:4318/v1/traces',
  });

  _sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    traceExporter: exporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new MongoDBInstrumentation({ dbStatementSerializer: (op) => op }),
      // Auto-instrumentations cover everything else (dns, net, etc.)
      getNodeAutoInstrumentations({
        // Disable the ones we register manually to avoid duplicates
        '@opentelemetry/instrumentation-http': { enabled: false },
        '@opentelemetry/instrumentation-express': { enabled: false },
        '@opentelemetry/instrumentation-mongodb': { enabled: false },
        // fs instrumentation is very noisy — keep it off
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  _sdk.start();

  // Flush spans on graceful shutdown
  process.on('SIGTERM', () => _sdk.shutdown().finally(() => process.exit(0)));
  process.on('SIGINT', () => _sdk.shutdown().finally(() => process.exit(0)));
}

/**
 * Returns a tracer scoped to the given instrumentation name.
 * @param {string} name
 * @returns {import('@opentelemetry/api').Tracer}
 */
export function getTracer(name) {
  return trace.getTracer(name);
}

/**
 * Returns the traceId and spanId of the currently active span, if any.
 * @returns {{ traceId: string, spanId: string } | { traceId: null, spanId: null }}
 */
export function getTraceContext() {
  const span = trace.getActiveSpan();
  if (!span) return { traceId: null, spanId: null };
  const ctx = span.spanContext();
  return { traceId: ctx.traceId, spanId: ctx.spanId };
}

// Re-export SpanStatusCode so callers don't need a direct OTel dep
export { SpanStatusCode, context };

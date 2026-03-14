import winston from 'winston';
import LokiTransport from 'winston-loki';
import { getTraceContext } from '@netflix-clone/tracing';

const { combine, timestamp, json, colorize, simple } = winston.format;

/**
 * Custom format that injects the active OTel traceId + spanId into every log entry.
 */
const traceContextFormat = winston.format((info) => {
  const { traceId, spanId } = getTraceContext();
  info.traceId = traceId ?? '';
  info.spanId = spanId ?? '';
  return info;
});

/**
 * Builds a Winston logger wired to Console + Loki transports.
 *
 * @param {string} serviceName - Identifies the service in every log line and as a Loki label.
 * @returns {import('winston').Logger}
 */
export function buildLogger(serviceName) {
  const isDev = process.env.NODE_ENV !== 'production';
  const isTest = process.env.NODE_ENV === 'test';

  const sharedFormat = combine(
    traceContextFormat(),
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format((info) => {
      info.service = serviceName;
      return info;
    })()
  );

  const transports = [
    new winston.transports.Console({
      format: isDev
        ? combine(colorize({ all: true }), simple())
        : json(),
    }),
  ];

  if (!isTest) {
    transports.push(
      new LokiTransport({
        host: process.env.LOKI_URL || 'http://loki:3100',
        labels: { service: serviceName },
        // Use default string transport with JSON format for best LogQL compatibility
        format: json(),
        onConnectionError: (err) =>
          console.error(`[${serviceName}] Loki connection error:`, err.message),
        replaceTimestamp: true,
        interval: 5,
        batching: true,
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: sharedFormat, // Apply metadata (traceId, timestamp, service) to ALL transports
    transports,
    exitOnError: false,
  });
}

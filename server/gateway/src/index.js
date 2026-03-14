import { initTracing } from '@netflix-clone/tracing';
initTracing('gateway');

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { getTracer, SpanStatusCode } from '@netflix-clone/tracing';
import { buildLogger } from '@netflix-clone/logger';
import { createRequestLogger } from '@netflix-clone/logger/requestLogger';
import { initMetrics, httpMetricsMiddleware, createResolverMetrics, metricsRoute } from '@netflix-clone/metrics';
import { decodeToken } from './auth.js';

const tracer = getTracer('gateway');
const logger = buildLogger('gateway');
const resolver = createResolverMetrics('gateway');
const registry = initMetrics('gateway');

const PORT = process.env.GATEWAY_PORT || 8080;

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL ||
  `http://localhost:${process.env.USER_SERVICE_PORT || 4001}/graphql`;
const MOVIE_SERVICE_URL =
  process.env.MOVIE_SERVICE_URL ||
  `http://localhost:${process.env.MOVIE_SERVICE_PORT || 4002}/graphql`;
const REVIEW_SERVICE_URL =
  process.env.REVIEW_SERVICE_URL ||
  `http://localhost:${process.env.REVIEW_SERVICE_PORT || 4003}/graphql`;

/**
 * Custom data source that forwards x-user-id and x-user-role
 * headers to every subgraph on each request.
 */
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }) {
      tracer.startActiveSpan('gateway.forwardRequest', (span) => {
        try {
          span.setAttribute('subgraph.url', this.url);
          if (context.userId) {
            request.http.headers.set('x-user-id', context.userId);
            span.setAttribute('user.id', context.userId);
          }
          if (context.userRole) {
            request.http.headers.set('x-user-role', context.userRole);
          }
        } finally {
          span.end();
        }
      });
    }
}

async function bootstrap() {
  // Retry gateway startup — subgraphs may not be ready immediately
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await startGateway();
      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        logger.error('Failed to start gateway after max retries', { error: err.message });
        process.exit(1);
      }
      logger.warn(`Gateway startup failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS / 1000}s...`, {
        error: err.message,
      });
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

async function startGateway() {
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        { name: 'user',   url: USER_SERVICE_URL },
        { name: 'movie',  url: MOVIE_SERVICE_URL },
        { name: 'review', url: REVIEW_SERVICE_URL },
      ],
      // Re-poll subgraph schemas every 30s so hot-reloads are picked up in dev
      pollIntervalInMs: process.env.NODE_ENV === 'development' ? 30_000 : undefined,
    }),
    buildService({ url }) {
      return new AuthenticatedDataSource({ url });
    },
  });

  const server = new ApolloServer({
    gateway,
    // Gateway manages its own schema — disable built-in schema validation
    includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development',
    formatError: (formattedError) => {
      // Unwrap downstream errors if they exist (e.g. from subgraphs)
      const graphQLErrors = formattedError.extensions?.response?.body?.errors;
      const downstreamError = graphQLErrors?.[0];
      
      const code = downstreamError?.extensions?.code || formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR';
      const path = formattedError.path?.join('.') || 'root';
      const message = downstreamError?.message || formattedError.message;
      const status = formattedError.extensions?.response?.status || 500;

      logger.error(`GraphQL Error [${code}] at ${path}: ${message}`, {
        code,
        path,
        message,
        statusCode: status,
        service: 'gateway',
        // Propagate the actual stacktrace from downstream if available, or the gateway's one
        stacktrace: downstreamError?.extensions?.stacktrace || formattedError.extensions?.stacktrace,
      });

      // Return a cleaner error to the client, but keep the specific code
      return {
        ...formattedError,
        message,
        extensions: {
          ...formattedError.extensions,
          code,
        }
      };
    },
  });

  await server.start();

  const app = express();

  // CORS — open in dev, restricted in prod
  const corsOptions =
    process.env.NODE_ENV === 'development'
      ? { origin: true, credentials: true }
      : {
          origin: (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()),
          credentials: true,
        };

  app.use(cors(corsOptions));
  app.use(bodyParser.json());
  app.use(httpMetricsMiddleware('gateway'));
  app.use(createRequestLogger(logger));

  app.use('/metrics', metricsRoute(registry));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'gateway',
      subgraphs: ['user', 'movie', 'review'],
    });
  });

  // GraphQL endpoint — decode JWT here, pass userId into context for all subgraphs
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        const start = Date.now();
        return tracer.startActiveSpan('gateway.authMiddleware', (span) => {
          try {
            const decoded = decodeToken(req.headers.authorization);
            const valid = decoded !== null;
            span.setAttribute('auth.valid', valid);

            if (!valid && req.headers.authorization) {
              const token = req.headers.authorization.slice(7);
              logger.warn('Invalid JWT token', { tokenPrefix: token?.slice(0, 10) });
            }

            const operation = req.body?.operationName ?? 'unknown';
            const userId = decoded?.id ?? null;
            logger.info('Request received', { operation, userId });

            const resolverStart = process.hrtime.bigint();
            res.on('finish', () => {
              resolver.recordResolver(operation, Number(process.hrtime.bigint() - resolverStart) / 1e9);
              logger.info('Request completed', {
                operation,
                durationMs: Date.now() - start,
                userId,
              });
            });

            return { userId, userRole: decoded?.role ?? null };
          } catch (err) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
            span.recordException(err);
            return { userId: null, userRole: null };
          } finally {
            span.end();
          }
        });
      },
    })
  );

  app.listen(PORT, () => {
    logger.info(`gateway running at http://localhost:${PORT}/graphql`);
  });
}

bootstrap();

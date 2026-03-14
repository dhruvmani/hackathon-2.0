import { initTracing } from '@netflix-clone/tracing';
initTracing('review-service');

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { buildLogger } from '@netflix-clone/logger';
import { createRequestLogger } from '@netflix-clone/logger/requestLogger';
import { initMetrics, httpMetricsMiddleware, dbConnectionsGauge, metricsRoute } from '@netflix-clone/metrics';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { buildContext } from './context.js';

const logger = buildLogger('review-service');
const dbGauge = dbConnectionsGauge('review-service');
const registry = initMetrics('review-service');
const PORT = process.env.REVIEW_SERVICE_PORT || 4003;

async function bootstrap() {
  await mongoose.connect(process.env.MONGO_URI_REVIEW);
  logger.info('MongoDB connected', { service: 'review-service' });
  dbGauge.inc();

  mongoose.connection.on('disconnected', () => dbGauge.dec());
  mongoose.connection.on('reconnected', () => dbGauge.inc());

  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development',
    formatError: (formattedError) => {
      const code = formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR';
      const path = formattedError.path?.join('.') || 'root';
      const status = formattedError.extensions?.http?.status || 500;

      logger.error(`GraphQL Error [${code}] at ${path}: ${formattedError.message}`, {
        code,
        path,
        statusCode: status,
      });
      return formattedError;
    },
  });

  await server.start();

  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(httpMetricsMiddleware('review-service'));
  app.use(createRequestLogger(logger));

  app.use('/metrics', metricsRoute(registry));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'review-service' });
  });

  app.use('/graphql', expressMiddleware(server, { context: buildContext }));

  app.listen(PORT, () => {
    logger.info(`review-service running on http://localhost:${PORT}/graphql`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start review-service', { error: err.message });
  process.exit(1);
});

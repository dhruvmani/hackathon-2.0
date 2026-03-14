import { initTracing } from '@netflix-clone/tracing';
initTracing('user-service');

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

const logger = buildLogger('user-service');
const dbGauge = dbConnectionsGauge('user-service');
const registry = initMetrics('user-service');
const PORT = process.env.USER_SERVICE_PORT || 4001;

async function bootstrap() {
  await mongoose.connect(process.env.MONGO_URI_USER);
  logger.info('MongoDB connected', { service: 'user-service' });
  dbGauge.inc();

  mongoose.connection.on('disconnected', () => dbGauge.dec());
  mongoose.connection.on('reconnected', () => dbGauge.inc());

  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development',
  });

  await server.start();

  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(httpMetricsMiddleware('user-service'));
  app.use(createRequestLogger(logger));

  app.use('/metrics', metricsRoute(registry));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
  });

  app.use('/graphql', expressMiddleware(server, { context: buildContext }));

  app.listen(PORT, () => {
    logger.info(`user-service running on http://localhost:${PORT}/graphql`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start user-service', { error: err.message });
  process.exit(1);
});

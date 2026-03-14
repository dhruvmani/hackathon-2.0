import { initTracing } from '@netflix-clone/tracing';
initTracing('movie-service');

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { buildLogger } from '@netflix-clone/logger';
import { createRequestLogger } from '@netflix-clone/logger/requestLogger';
import { initMetrics, httpMetricsMiddleware, dbConnectionsGauge, metricsRoute } from '@netflix-clone/metrics';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { buildContext } from './context.js';
import { Movie } from './models/Movie.js';
import * as cache from './services/cacheService.js';
import * as anomaly from './anomaly.js';
import { Gauge } from 'prom-client';

const logger = buildLogger('movie-service');
const dbGauge = dbConnectionsGauge('movie-service');
const registry = initMetrics('movie-service');
const PORT = process.env.MOVIE_SERVICE_PORT || 4002;

const heapGauge = new Gauge({
  name: 'process_heap_used_bytes',
  help: 'Process heap used bytes (anomaly monitoring)',
  registers: [registry],
});

setInterval(() => {
  heapGauge.set(process.memoryUsage().heapUsed);
}, 5000);

const UPLOAD_DIR = 'uploads/banners';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

async function bootstrap() {
  await mongoose.connect(process.env.MONGO_URI_MOVIE);
  logger.info('MongoDB connected', { service: 'movie-service' });
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
  app.use('/uploads/banners', express.static(UPLOAD_DIR));
  app.use(httpMetricsMiddleware('movie-service'));
  app.use(createRequestLogger(logger));
  app.use('/metrics', metricsRoute(registry));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'movie-service' });
  });

  // REST endpoint for banner upload (multipart/form-data, field name: "file")
  app.post('/upload/banner/:movieId', upload.single('file'), async (req, res) => {
    try {
      const movie = await Movie.findById(req.params.movieId);
      if (!movie) return res.status(404).json({ error: 'Movie not found' });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      movie.bannerUrl = `/uploads/banners/${req.file.filename}`;
      await movie.save();
      await cache.del(`movie:${req.params.movieId}`);

      logger.info('Banner uploaded', { movieId: req.params.movieId });
      res.json({ bannerUrl: movie.bannerUrl });
    } catch (err) {
      logger.error('Banner upload failed', { error: err.message });
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  app.use(bodyParser.json());

  // Anomaly Control Endpoints
  app.post('/anomaly/set', (req, res) => {
    const { type } = req.body;
    if (anomaly.setAnomalyType(type)) {
      res.json({ status: 'ok', type: anomaly.getAnomalyType() });
    } else {
      res.status(400).json({ error: 'Invalid anomaly type' });
    }
  });

  app.post('/anomaly/drop-index', async (req, res) => {
    try {
      await Movie.collection.dropIndex('title_1').catch(() => {});
      logger.warn('ANOMALY: title index dropped');
      res.json({ status: 'ok' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/anomaly/leak', (req, res) => {
    const chunk = Array.from({ length: 500_000 }, (_, i) => ({
      id: i,
      data: 'x'.repeat(200),
    }));
    global.__memLeak = (global.__memLeak || []).concat(chunk);
    logger.warn('ANOMALY: memory leak chunk added', { totalItems: global.__memLeak.length });
    res.json({ status: 'ok', totalItems: global.__memLeak.length });
  });

  app.use('/graphql', expressMiddleware(server, { context: buildContext }));

  app.listen(PORT, () => {
    logger.info(`movie-service running on http://localhost:${PORT}/graphql`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start movie-service', { error: err.message });
  process.exit(1);
});

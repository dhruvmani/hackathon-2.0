import { GraphQLError } from 'graphql';
import { getTracer, SpanStatusCode } from '@netflix-clone/tracing';
import { buildLogger } from '@netflix-clone/logger';
import { createDbMetrics, createCacheMetrics, createResolverMetrics } from '@netflix-clone/metrics';
import { Movie } from './models/Movie.js';
import * as cache from './services/cacheService.js';
import * as anomaly from './anomaly.js';

const tracer = getTracer('movie-service');
const logger = buildLogger('movie-service');
const db = createDbMetrics('movie-service');
const cacheMetrics = createCacheMetrics('movie-service');
const resolver = createResolverMetrics('movie-service');

const MOVIE_TTL = 600;
const LIST_TTL = 120;

function gqlError(message, code, status = 400) {
  throw new GraphQLError(message, {
    extensions: { code, http: { status } },
  });
}

function formatMovie(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    genre: doc.genre,
    releaseYear: doc.releaseYear,
    bannerUrl: doc.bannerUrl || null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const resolvers = {
  Query: {
    movies: async (_parent, { page = 1, limit = 10 }) => {
      const resolverStart = process.hrtime.bigint();
      return tracer.startActiveSpan('controller.getMovies', async (span) => {
        try {
          span.setAttribute('pagination.page', page);
          span.setAttribute('pagination.limit', limit);

          if (page < 1 || limit < 1 || limit > 100) {
            gqlError('Invalid pagination parameters', 'INVALID_PAGINATION');
          }

          const cacheKey = `movies:page:${page}:limit:${limit}`;

          const cached = await tracer.startActiveSpan('cache.checkMovieList', async (cSpan) => {
            try {
              const hit = await cache.get(cacheKey);
              cSpan.setAttribute('cache.key', cacheKey);
              cSpan.setAttribute('cache.hit', hit !== null);
              return hit;
            } catch (err) {
              cSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              cSpan.recordException(err);
              return null;
            } finally {
              cSpan.end();
            }
          });

          if (cached) {
            cacheMetrics.recordHit('movies:page');
            logger.info('Movies cache hit', { cacheKey, page, limit });
            return cached;
          }
          cacheMetrics.recordMiss('movies:page');

          const start = Date.now();
          const skip = (page - 1) * limit;

          await anomaly.injectDelay();

          let dbErr;
          const dbStart = process.hrtime.bigint();
          const [movies, total] = await tracer.startActiveSpan('db.fetchMovies', async (dbSpan) => {
            try {
              anomaly.injectFlakyError();

              const type = anomaly.getAnomalyType();
              if (type === anomaly.AnomalyType.LARGE_PAYLOAD) {
                const allMovies = await Movie.find().sort({ createdAt: -1 });
                logger.warn('ANOMALY: returning full unpaginated dataset', { count: allMovies.length });
                return [allMovies, allMovies.length];
              }

              if (type === anomaly.AnomalyType.NO_INDEX) {
                // Simulating unindexed lookup by forcing a regex on potentially any field
                return await Promise.all([
                  Movie.find({ title: { $regex: '.*' } }).sort({ createdAt: -1 }),
                  Movie.countDocuments(),
                ]);
              }

              return await Promise.all([
                Movie.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
                Movie.countDocuments(),
              ]);
            } catch (err) {
              dbErr = err;
              dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              dbSpan.recordException(err);
              logger.error('DB error fetching movies', { error: err.message });
              throw err;
            } finally {
              db.recordQuery('movies', 'find', Number(process.hrtime.bigint() - dbStart) / 1e9, dbErr);
              dbSpan.end();
            }
          });

          logger.info('Movies fetched from DB', { page, limit, count: movies.length, durationMs: Date.now() - start });

          const result = {
            movies: movies.map(formatMovie),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          };

          await tracer.startActiveSpan('cache.setMovieList', async (cSpan) => {
            try {
              cSpan.setAttribute('cache.key', cacheKey);
              cSpan.setAttribute('cache.ttl', LIST_TTL);
              await cache.set(cacheKey, result, LIST_TTL);
            } catch (err) {
              cSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              cSpan.recordException(err);
            } finally {
              cSpan.end();
            }
          });

          return result;
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          span.recordException(err);
          throw err;
        } finally {
          resolver.recordResolver('movies', Number(process.hrtime.bigint() - resolverStart) / 1e9);
          span.end();
        }
      });
    },

    movie: async (_parent, { id }) => {
      const resolverStart = process.hrtime.bigint();
      return tracer.startActiveSpan('controller.getMovie', async (span) => {
        try {
          span.setAttribute('movie.id', id);
          const cacheKey = `movie:${id}`;

          const cached = await tracer.startActiveSpan('cache.checkMovie', async (cSpan) => {
            try {
              const hit = await cache.get(cacheKey);
              cSpan.setAttribute('cache.key', cacheKey);
              cSpan.setAttribute('cache.hit', hit !== null);
              return hit;
            } catch (err) {
              cSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              cSpan.recordException(err);
              return null;
            } finally {
              cSpan.end();
            }
          });

          if (cached) {
            cacheMetrics.recordHit('movie');
            logger.info('Movie fetched by ID', { movieId: id, source: 'cache' });
            return cached;
          }
          cacheMetrics.recordMiss('movie');

          let dbErr;
          const dbStart = process.hrtime.bigint();
          const movie = await tracer.startActiveSpan('db.fetchMovie', async (dbSpan) => {
            try {
              return await Movie.findById(id).catch(() => null);
            } catch (err) {
              dbErr = err;
              dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              dbSpan.recordException(err);
              throw err;
            } finally {
              db.recordQuery('movies', 'findById', Number(process.hrtime.bigint() - dbStart) / 1e9, dbErr);
              dbSpan.end();
            }
          });

          if (!movie) {
            logger.warn('Movie not found', { movieId: id });
            gqlError('Movie not found', 'MOVIE_NOT_FOUND', 404);
          }

          logger.info('Movie fetched by ID', { movieId: id, source: 'db' });
          const result = formatMovie(movie);
          await cache.set(cacheKey, result, MOVIE_TTL);
          return result;
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          span.recordException(err);
          throw err;
        } finally {
          resolver.recordResolver('movie', Number(process.hrtime.bigint() - resolverStart) / 1e9);
          span.end();
        }
      });
    },
  },

  Mutation: {
    addMovie: async (_parent, { title, description, genre, releaseYear }) => {
      const resolverStart = process.hrtime.bigint();
      return tracer.startActiveSpan('controller.addMovie', async (span) => {
        try {
          span.setAttribute('movie.title', title);
          const start = process.hrtime.bigint();
          const movie = await Movie.create({ title, description, genre, releaseYear });
          db.recordQuery('movies', 'create', Number(process.hrtime.bigint() - start) / 1e9);
          
          logger.info('Movie added', { movieId: movie._id, title });
          return formatMovie(movie);
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          span.recordException(err);
          throw err;
        } finally {
          resolver.recordResolver('addMovie', Number(process.hrtime.bigint() - resolverStart) / 1e9);
          span.end();
        }
      });
    },
  },

  Movie: {
    __resolveReference: async ({ id }) => {
      const cacheKey = `movie:${id}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const movie = await Movie.findById(id).catch(() => null);
      if (!movie) gqlError('Movie not found', 'MOVIE_NOT_FOUND', 404);

      const result = formatMovie(movie);
      await cache.set(cacheKey, result, MOVIE_TTL);
      return result;
    },
  },
};

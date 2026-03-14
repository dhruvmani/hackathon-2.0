import { GraphQLError } from 'graphql';
import { getTracer, SpanStatusCode } from '@netflix-clone/tracing';
import { buildLogger } from '@netflix-clone/logger';
import { createDbMetrics, createCacheMetrics, createResolverMetrics } from '@netflix-clone/metrics';
import { Review } from './models/Review.js';
import * as cache from './services/cacheService.js';

const tracer = getTracer('review-service');
const logger = buildLogger('review-service');
const db = createDbMetrics('review-service');
const cacheMetrics = createCacheMetrics('review-service');
const resolver = createResolverMetrics('review-service');

const REVIEWS_TTL = 180;

function gqlError(message, code, status = 400) {
  throw new GraphQLError(message, {
    extensions: { code, http: { status } },
  });
}

function formatReview(doc) {
  return {
    id: doc._id.toString(),
    movieId: doc.movieId,
    userId: doc.userId,
    rating: doc.rating,
    comment: doc.comment,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function fetchReviewsByMovie(movieId) {
  const resolverStart = process.hrtime.bigint();
  return tracer.startActiveSpan('controller.getReviews', async (span) => {
    try {
      span.setAttribute('movie.id', movieId);
      const cacheKey = `reviews:movie:${movieId}`;

      const cached = await tracer.startActiveSpan('cache.checkReviews', async (cSpan) => {
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
        cacheMetrics.recordHit('reviews:movie');
        logger.info('Reviews fetched', { movieId, count: cached.length, source: 'cache' });
        return cached;
      }
      cacheMetrics.recordMiss('reviews:movie');

      let dbErr;
      const dbStart = process.hrtime.bigint();
      const reviews = await tracer.startActiveSpan('db.fetchReviews', async (dbSpan) => {
        try {
          return await Review.find({ movieId }).sort({ createdAt: -1 });
        } catch (err) {
          dbErr = err;
          dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          dbSpan.recordException(err);
          throw err;
        } finally {
          db.recordQuery('reviews', 'find', Number(process.hrtime.bigint() - dbStart) / 1e9, dbErr);
          dbSpan.end();
        }
      });

      const result = reviews.map(formatReview);
      logger.info('Reviews fetched', { movieId, count: result.length, source: 'db' });
      await cache.set(cacheKey, result, REVIEWS_TTL);
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      resolver.recordResolver('reviewsByMovie', Number(process.hrtime.bigint() - resolverStart) / 1e9);
      span.end();
    }
  });
}

export const resolvers = {
  Query: {
    reviewsByMovie: (_parent, { movieId }) => fetchReviewsByMovie(movieId),
  },

  Mutation: {
    postReview: async (_parent, { movieId, rating, comment }, context) => {
      const resolverStart = process.hrtime.bigint();
      return tracer.startActiveSpan('controller.postReview', async (span) => {
        try {
          span.setAttribute('movie.id', movieId);
          span.setAttribute('review.rating', rating);
          if (context.userId) span.setAttribute('user.id', context.userId);

          if (!context.userId) {
            logger.warn('Unauthenticated review attempt', { movieId });
            gqlError('You must be logged in to post a review', 'UNAUTHENTICATED', 401);
          }

          await tracer.startActiveSpan('service.validateReview', async (vSpan) => {
            try {
              const issues = [];
              if (rating < 1 || rating > 5) issues.push('rating must be 1-5');
              if (!comment || comment.trim().length === 0) issues.push('comment cannot be empty');

              if (issues.length > 0) {
                logger.warn('Review validation failed', { userId: context.userId, movieId, issues });
                gqlError(issues.join(', '), 'VALIDATION_ERROR');
              }

              const existing = await Review.findOne({ movieId, userId: context.userId });
              if (existing) {
                logger.warn('Review validation failed', {
                  userId: context.userId,
                  movieId,
                  issues: ['already reviewed'],
                });
                gqlError('You have already reviewed this movie', 'VALIDATION_ERROR', 409);
              }
            } catch (err) {
              vSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              vSpan.recordException(err);
              throw err;
            } finally {
              vSpan.end();
            }
          });

          let dbErr;
          const dbStart = process.hrtime.bigint();
          const review = await tracer.startActiveSpan('db.insertReview', async (dbSpan) => {
            try {
              return await Review.create({
                movieId,
                userId: context.userId,
                rating,
                comment: comment.trim(),
              });
            } catch (err) {
              dbErr = err;
              dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              dbSpan.recordException(err);
              logger.error('DB error posting review', { userId: context.userId, movieId, error: err.message });
              throw err;
            } finally {
              db.recordQuery('reviews', 'insertOne', Number(process.hrtime.bigint() - dbStart) / 1e9, dbErr);
              dbSpan.end();
            }
          });

          await tracer.startActiveSpan('cache.invalidateReviews', async (cSpan) => {
            try {
              const cacheKey = `reviews:movie:${movieId}`;
              cSpan.setAttribute('cache.key', cacheKey);
              await cache.del(cacheKey);
            } catch (err) {
              cSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              cSpan.recordException(err);
            } finally {
              cSpan.end();
            }
          });

          logger.info('Review posted', { userId: context.userId, movieId, rating });
          return formatReview(review);
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          span.recordException(err);
          throw err;
        } finally {
          resolver.recordResolver('postReview', Number(process.hrtime.bigint() - resolverStart) / 1e9);
          span.end();
        }
      });
    },
  },

  Review: {
    __resolveReference: async ({ id }) => {
      const review = await Review.findById(id).catch(() => null);
      if (!review) gqlError('Review not found', 'REVIEW_NOT_FOUND', 404);
      return formatReview(review);
    },
  },

  Movie: {
    reviews: ({ id }) => fetchReviewsByMovie(id),
  },

  User: {
    reviews: async ({ id }) => {
      const reviews = await Review.find({ userId: id }).sort({ createdAt: -1 });
      return reviews.map(formatReview);
    },
  },
};

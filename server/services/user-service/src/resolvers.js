import { GraphQLError } from 'graphql';
import { signToken } from '@netflix-clone/shared/jwtUtils';
import { getTracer, SpanStatusCode } from '@netflix-clone/tracing';
import { buildLogger } from '@netflix-clone/logger';
import { createDbMetrics, createResolverMetrics, activeUsersGauge } from '@netflix-clone/metrics';
import { User } from './models/User.js';

const tracer = getTracer('user-service');
const logger = buildLogger('user-service');
const db = createDbMetrics('user-service');
const resolver = createResolverMetrics('user-service');
const usersGauge = activeUsersGauge('user-service');

function gqlError(message, code, statusCode = 400) {
  throw new GraphQLError(message, {
    extensions: { code, http: { status: statusCode } },
  });
}

function formatUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      const resolverStart = process.hrtime.bigint();
      return tracer.startActiveSpan('controller.me', async (span) => {
        try {
          if (!context.userId) {
            logger.warn('Unauthorized access to me query', {});
            gqlError('You must be logged in', 'UNAUTHENTICATED', 401);
          }
          span.setAttribute('user.id', context.userId);

          const dbStart = process.hrtime.bigint();
          let dbErr;
          const user = await tracer.startActiveSpan('db.findUserById', async (dbSpan) => {
            try {
              return await User.findById(context.userId);
            } catch (err) {
              dbErr = err;
              dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              dbSpan.recordException(err);
              throw err;
            } finally {
              db.recordQuery('users', 'findById', Number(process.hrtime.bigint() - dbStart) / 1e9, dbErr);
              dbSpan.end();
            }
          });

          if (!user) gqlError('User not found', 'USER_NOT_FOUND', 404);
          return formatUser(user);
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          span.recordException(err);
          throw err;
        } finally {
          resolver.recordResolver('me', Number(process.hrtime.bigint() - resolverStart) / 1e9);
          span.end();
        }
      });
    },
  },

  Mutation: {
    register: async (_parent, { name, email, password }) => {
      const resolverStart = process.hrtime.bigint();
      return tracer.startActiveSpan('controller.register', async (span) => {
        try {
          span.setAttribute('user.email', email);

          // findOne
          let findErr;
          const findStart = process.hrtime.bigint();
          const existing = await tracer.startActiveSpan('db.findUserByEmail', async (dbSpan) => {
            try {
              return await User.findOne({ email });
            } catch (err) {
              findErr = err;
              dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              dbSpan.recordException(err);
              throw err;
            } finally {
              db.recordQuery('users', 'findOne', Number(process.hrtime.bigint() - findStart) / 1e9, findErr);
              dbSpan.end();
            }
          });

          if (existing) gqlError('Email already in use', 'USER_ALREADY_EXISTS', 409);

          // insertOne
          let insertErr;
          const insertStart = process.hrtime.bigint();
          const user = await tracer.startActiveSpan('db.createUser', async (dbSpan) => {
            try {
              return await User.create({ name, email, password });
            } catch (err) {
              insertErr = err;
              dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              dbSpan.recordException(err);
              logger.error('DB error during registration', { error: err.message, email });
              throw err;
            } finally {
              db.recordQuery('users', 'insertOne', Number(process.hrtime.bigint() - insertStart) / 1e9, insertErr);
              dbSpan.end();
            }
          });

          const token = tracer.startActiveSpan('service.generateToken', (tokenSpan) => {
            try {
              return signToken(
                { id: user._id.toString(), role: user.role },
                process.env.JWT_SECRET,
                process.env.JWT_EXPIRES_IN
              );
            } catch (err) {
              tokenSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              tokenSpan.recordException(err);
              throw err;
            } finally {
              tokenSpan.end();
            }
          });

          logger.info('User registered', { userId: user._id.toString(), email });
          return { token, user: formatUser(user) };
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          span.recordException(err);
          throw err;
        } finally {
          resolver.recordResolver('register', Number(process.hrtime.bigint() - resolverStart) / 1e9);
          span.end();
        }
      });
    },

    login: async (_parent, { email, password }) => {
      const resolverStart = process.hrtime.bigint();
      return tracer.startActiveSpan('controller.login', async (span) => {
        try {
          span.setAttribute('user.email', email);

          let findErr;
          const findStart = process.hrtime.bigint();
          const user = await tracer.startActiveSpan('db.findUserByEmail', async (dbSpan) => {
            try {
              return await User.findOne({ email }).select('+password');
            } catch (err) {
              findErr = err;
              dbSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              dbSpan.recordException(err);
              throw err;
            } finally {
              db.recordQuery('users', 'findOne', Number(process.hrtime.bigint() - findStart) / 1e9, findErr);
              dbSpan.end();
            }
          });

          if (!user) {
            logger.warn('Login failed - user not found', { email });
            gqlError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
          }

          const passwordValid = await user.comparePassword(password);
          if (!passwordValid) {
            logger.warn('Login failed - invalid credentials', { email });
            gqlError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
          }

          const token = tracer.startActiveSpan('service.generateToken', (tokenSpan) => {
            try {
              return signToken(
                { id: user._id.toString(), role: user.role },
                process.env.JWT_SECRET,
                process.env.JWT_EXPIRES_IN
              );
            } catch (err) {
              tokenSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
              tokenSpan.recordException(err);
              throw err;
            } finally {
              tokenSpan.end();
            }
          });

          usersGauge.inc();
          logger.info('User logged in', { userId: user._id.toString(), email });
          return { token, user: formatUser(user) };
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
          span.recordException(err);
          throw err;
        } finally {
          resolver.recordResolver('login', Number(process.hrtime.bigint() - resolverStart) / 1e9);
          span.end();
        }
      });
    },
  },

  User: {
    __resolveReference: async ({ id }) => {
      const user = await User.findById(id);
      if (!user) gqlError('User not found', 'USER_NOT_FOUND', 404);
      return formatUser(user);
    },
  },
};

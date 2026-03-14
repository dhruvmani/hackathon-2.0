# ── Stage 1: development ──────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

RUN npm install -g nodemon

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tracing/package.json ./packages/tracing/
COPY packages/logger/package.json ./packages/logger/
COPY packages/metrics/package.json ./packages/metrics/
COPY services/movie-service/package.json ./services/movie-service/

RUN npm install

COPY packages/shared ./packages/shared
COPY packages/tracing ./packages/tracing
COPY packages/logger ./packages/logger
COPY packages/metrics ./packages/metrics
COPY services/movie-service ./services/movie-service

# Ensure upload directory exists
RUN mkdir -p /app/services/movie-service/uploads/banners

WORKDIR /app/services/movie-service

CMD ["nodemon", "--watch", "src", "--ext", "js", "src/index.js"]

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tracing/package.json ./packages/tracing/
COPY packages/logger/package.json ./packages/logger/
COPY packages/metrics/package.json ./packages/metrics/
COPY services/movie-service/package.json ./services/movie-service/

RUN npm ci --omit=dev

COPY packages/shared ./packages/shared
COPY packages/tracing ./packages/tracing
COPY packages/logger ./packages/logger
COPY packages/metrics ./packages/metrics
COPY services/movie-service ./services/movie-service

RUN mkdir -p /app/services/movie-service/uploads/banners

USER node

WORKDIR /app/services/movie-service

CMD ["node", "src/index.js"]

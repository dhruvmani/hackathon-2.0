# ── Stage 1: development ──────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

RUN npm install -g nodemon

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tracing/package.json ./packages/tracing/
COPY packages/logger/package.json ./packages/logger/
COPY packages/metrics/package.json ./packages/metrics/
COPY gateway/package.json ./gateway/

RUN npm install

COPY packages/shared ./packages/shared
COPY packages/tracing ./packages/tracing
COPY packages/logger ./packages/logger
COPY packages/metrics ./packages/metrics
COPY gateway ./gateway

WORKDIR /app/gateway

CMD ["nodemon", "--watch", "src", "--ext", "js", "src/index.js"]

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tracing/package.json ./packages/tracing/
COPY packages/logger/package.json ./packages/logger/
COPY packages/metrics/package.json ./packages/metrics/
COPY gateway/package.json ./gateway/

RUN npm ci --omit=dev

COPY packages/shared ./packages/shared
COPY packages/tracing ./packages/tracing
COPY packages/logger ./packages/logger
COPY packages/metrics ./packages/metrics
COPY gateway ./gateway

USER node

WORKDIR /app/gateway

CMD ["node", "src/index.js"]

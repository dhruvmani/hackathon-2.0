# ── Stage 1: development ──────────────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Install nodemon globally for hot reload
RUN npm install -g nodemon

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tracing/package.json ./packages/tracing/
COPY packages/logger/package.json ./packages/logger/
COPY packages/metrics/package.json ./packages/metrics/
COPY services/user-service/package.json ./services/user-service/

# Install all workspace dependencies from root
RUN npm install

# Copy source (volumes will override in dev, but needed for image completeness)
COPY packages/shared ./packages/shared
COPY packages/tracing ./packages/tracing
COPY packages/logger ./packages/logger
COPY packages/metrics ./packages/metrics
COPY services/user-service ./services/user-service

WORKDIR /app/services/user-service

CMD ["nodemon", "--watch", "src", "--ext", "js", "src/index.js"]

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/tracing/package.json ./packages/tracing/
COPY packages/logger/package.json ./packages/logger/
COPY packages/metrics/package.json ./packages/metrics/
COPY services/user-service/package.json ./services/user-service/

RUN npm ci --omit=dev

COPY packages/shared ./packages/shared
COPY packages/tracing ./packages/tracing
COPY packages/logger ./packages/logger
COPY packages/metrics ./packages/metrics
COPY services/user-service ./services/user-service

# Run as non-root
USER node

WORKDIR /app/services/user-service

CMD ["node", "src/index.js"]

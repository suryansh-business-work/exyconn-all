# =============================================================================
# Exyconn Tools Server - Multi-stage Dockerfile
# Service: tools-server | Port: 4002 | Domain: tools-api.exyconn.com
# Build: Node16 moduleResolution fix - Feb 2026
# Note: Using node:20-slim (Debian) for glibc compatibility with onnxruntime-node
# =============================================================================

# Stage 1: Dependencies
# NPM_TOKEN authenticates the private @exyconn/common package. It is written to a
# throwaway .npmrc and removed in the SAME layer, so the token never persists in any image.
FROM node:20-slim AS deps
WORKDIR /app
ARG NPM_TOKEN
COPY package.json ./
RUN if [ -n "$NPM_TOKEN" ]; then { \
      echo "@exyconn:registry=https://npm.pkg.github.com"; \
      echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}"; \
    } > .npmrc; fi && \
    rm -f package-lock.json && npm install --legacy-peer-deps --include=optional && \
    rm -f .npmrc

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 3: Production
FROM node:20-slim AS production
WORKDIR /app

# Install wget for health check and create non-root user
RUN apt-get update && apt-get install -y --no-install-recommends wget && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nodejs && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Copy production files (prod install also needs the private-package token, same scrubbing)
ARG NPM_TOKEN
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
RUN if [ -n "$NPM_TOKEN" ]; then { \
      echo "@exyconn:registry=https://npm.pkg.github.com"; \
      echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}"; \
    } > .npmrc; fi && \
    npm install --omit=dev --legacy-peer-deps && npm cache clean --force && \
    rm -f .npmrc

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:4002/health || exit 1

EXPOSE 4002

ENV NODE_ENV=production
ENV PORT=4002

CMD ["node", "dist/index.js"]

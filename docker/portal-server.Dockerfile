# =============================================================================
# Exyconn Portal API (GraphQL server)
# Service: portal-server | Port: 4004 | Domain: portal-server.exyconn.com
# Build context: the monorepo ROOT (this package lives in a pnpm workspace).
# =============================================================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# --- Install: copy only manifests first so the dependency layer caches ---------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY exyconn-portal/package.json exyconn-portal/
COPY exyconn-portal/server/package.json exyconn-portal/server/
COPY exyconn-portal/ui/package.json exyconn-portal/ui/
COPY exyconn-website/package.json exyconn-website/
COPY exyconn-tracker-app/package.json exyconn-tracker-app/
RUN pnpm install --frozen-lockfile --filter exyconn-portal-server...

# --- Build + produce a self-contained deploy bundle ---------------------------
FROM deps AS build
COPY exyconn-portal/server exyconn-portal/server
RUN pnpm --filter exyconn-portal-server run build \
  && pnpm --filter exyconn-portal-server deploy --prod /app

# --- Runtime ------------------------------------------------------------------
FROM node:22-alpine AS runtime
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=build --chown=nodejs:nodejs /app /app
USER nodejs

ENV NODE_ENV=production
ENV PORT=4004
EXPOSE 4004
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4004/health || exit 1

CMD ["node", "dist/server.js"]

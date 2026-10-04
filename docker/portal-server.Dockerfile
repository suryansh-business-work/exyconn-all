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
# The server imports @exyconn/wa-flow's compiled build; its workspace dependencies (regex,
# and config through both as a dev dependency) are resolved by the filtered install too.
COPY packages/wa-flow/package.json packages/wa-flow/
COPY packages/regex/package.json packages/regex/
COPY packages/config/package.json packages/config/
# The root `prepare` script runs on every install, this one included; it needs its own
# file present. It no-ops without a .git directory, which an image never has.
COPY scripts/install-git-hooks.mjs scripts/
RUN pnpm install --frozen-lockfile --filter exyconn-portal-server...

# --- Build + produce a self-contained deploy bundle ---------------------------
FROM deps AS build
# wa-flow is built first: the server's tsc reads its dist types, and `deploy` copies its dist.
# regex is built too: wa-flow's compiled engine requires it, and the runtime can only load its
# dist (Node will not strip types under node_modules). Both tsconfig.build.json files are
# standalone, so their source is all they need.
COPY packages/regex packages/regex
COPY packages/wa-flow packages/wa-flow
RUN pnpm --filter @exyconn/regex run build && pnpm --filter @exyconn/wa-flow run build
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

# `exyconn-compiled` points @exyconn/regex at its dist instead of its TypeScript source.
CMD ["node", "--conditions=exyconn-compiled", "dist/server.js"]

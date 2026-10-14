# =============================================================================
# Exyconn AI calling bot demo — voice server
# Service: calling-bot-voice | Port: 4042 | demos.exyconn.com/calling-bot-demo/api/
# Build context: the monorepo ROOT (the package lives in the pnpm workspace).
#
# Live audio only: a browser call's socket, and Vobiz's answer/hangup callbacks and media
# stream for a phone call, through Sarvam speech-to-text, OpenAI and Sarvam text-to-speech.
# Its settings and its calls are in the portal's database (MONGODB_URI); every credential is
# in the active calling bot config there (Tech > Demos > Calling bot), none in this image.
# =============================================================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json packages/config/
COPY demos/calling-bot-demo/server/package.json demos/calling-bot-demo/server/
# The root `prepare` script runs on every install, this one included; it needs its own file.
COPY scripts/install-git-hooks.mjs scripts/
RUN pnpm install --frozen-lockfile --filter @exyconn/calling-bot-demo-server...

FROM deps AS build
COPY demos/calling-bot-demo/server demos/calling-bot-demo/server
RUN pnpm --filter @exyconn/calling-bot-demo-server run build \
  && pnpm --filter @exyconn/calling-bot-demo-server deploy --prod /app

FROM node:22-alpine AS runtime
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=build --chown=nodejs:nodejs /app /app
USER nodejs

ENV NODE_ENV=production
ENV PORT=4042
EXPOSE 4042
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4042/health || exit 1

CMD ["node", "dist/runtime/main.js"]

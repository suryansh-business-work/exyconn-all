# =============================================================================
# Exyconn Website (Astro SSR, node standalone adapter)
# Service: website | Port: 4000 | Domain: exyconn.com
# Build context: the monorepo ROOT (pnpm workspace).
# =============================================================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY exyconn-portal/package.json exyconn-portal/
COPY exyconn-portal/server/package.json exyconn-portal/server/
COPY exyconn-portal/ui/package.json exyconn-portal/ui/
COPY exyconn-website/package.json exyconn-website/
COPY exyconn-tracker-app/package.json exyconn-tracker-app/
RUN pnpm install --frozen-lockfile --filter exyconn...

FROM deps AS build
COPY exyconn-website exyconn-website
# `pnpm deploy` packs with gitignore semantics and the website gitignores `dist/`, so it
# would omit the Astro build. Deploy gives us the prod node_modules; copy dist in explicitly.
RUN pnpm --filter exyconn run build \
  && pnpm --filter exyconn deploy --prod /app \
  && cp -r exyconn-website/dist /app/dist

FROM node:22-alpine AS runtime
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=build --chown=nodejs:nodejs /app /app
USER nodejs

# Astro's standalone node server reads HOST and PORT from the environment.
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4000/health || exit 1

CMD ["node", "./dist/server/entry.mjs"]

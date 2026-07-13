# =============================================================================
# Exyconn Portal UI (React + Vite admin)
# Service: portal-ui | Port: 4003 | Domain: portal.exyconn.com
# Build context: the monorepo ROOT (pnpm workspace). Static build served by nginx.
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
# UI only: codegen output is committed and `build` doesn't run codegen, so the server
# package is not needed here (and pulling it in would drag in mongodb-memory-server).
RUN pnpm install --frozen-lockfile --filter exyconn-portal-ui...

FROM deps AS build
# VITE_* values are inlined at build time, so the API URL must be a build ARG.
ARG VITE_GRAPHQL_URL=https://portal-server.exyconn.com/graphql
ENV VITE_GRAPHQL_URL=${VITE_GRAPHQL_URL}
COPY exyconn-portal/ui exyconn-portal/ui
RUN pnpm --filter exyconn-portal-ui run build

FROM nginx:alpine AS runtime
RUN apk add --no-cache wget
COPY --from=build /repo/exyconn-portal/ui/dist /usr/share/nginx/html
COPY docker/spa.nginx.conf /etc/nginx/templates/default.conf.template
ENV NGINX_PORT=4003
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4003/ || exit 1

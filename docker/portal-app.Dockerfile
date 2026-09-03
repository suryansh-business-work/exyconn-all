# =============================================================================
# Exyconn Portal micro-frontend (React + Vite + MUI)
#
# One image definition for every portal app: the hub (portal.exyconn.com) and the
# 15 module apps (hr.exyconn.com, ai.exyconn.com, ...). APP_DIR/APP_PKG select
# which workspace package to build, PORT is the host port nginx proxies to, and
# VITE_PORTAL_APP tells the shell which app it is so cross-app links resolve.
#
# Build context: the monorepo ROOT (pnpm workspace). Static build served by nginx.
# =============================================================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# Manifests only, so a source edit does not invalidate the install layer. Every
# workspace package a portal app can reach has to be listed: a missing manifest
# makes pnpm resolve nothing for that filter, and the build dies on "tsc: not
# found" rather than on the actual cause. scripts/check-docker-manifests.mjs
# keeps this list honest.
FROM base AS deps
ARG APP_PKG
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/crud/package.json packages/crud/
COPY packages/shell/package.json packages/shell/
COPY packages/login/package.json packages/login/
COPY packages/tabber/package.json packages/tabber/
COPY exyconn-portal/package.json exyconn-portal/
COPY exyconn-portal/server/package.json exyconn-portal/server/
COPY exyconn-portal/ui/package.json exyconn-portal/ui/
COPY exyconn-portal/apps/admin/package.json exyconn-portal/apps/admin/
COPY exyconn-portal/apps/ai/package.json exyconn-portal/apps/ai/
COPY exyconn-portal/apps/crm/package.json exyconn-portal/apps/crm/
COPY exyconn-portal/apps/employee/package.json exyconn-portal/apps/employee/
COPY exyconn-portal/apps/finance/package.json exyconn-portal/apps/finance/
COPY exyconn-portal/apps/hr/package.json exyconn-portal/apps/hr/
COPY exyconn-portal/apps/it/package.json exyconn-portal/apps/it/
COPY exyconn-portal/apps/legal/package.json exyconn-portal/apps/legal/
COPY exyconn-portal/apps/marketing/package.json exyconn-portal/apps/marketing/
COPY exyconn-portal/apps/products/package.json exyconn-portal/apps/products/
COPY exyconn-portal/apps/projects/package.json exyconn-portal/apps/projects/
COPY exyconn-portal/apps/support/package.json exyconn-portal/apps/support/
COPY exyconn-portal/apps/tech/package.json exyconn-portal/apps/tech/
COPY exyconn-portal/apps/tracker/package.json exyconn-portal/apps/tracker/
COPY exyconn-portal/apps/website/package.json exyconn-portal/apps/website/
COPY exyconn-website/package.json exyconn-website/
COPY exyconn-tracker-app/package.json exyconn-tracker-app/
# Frontends only: codegen output is committed and `build` doesn't run codegen, so the
# server package is not needed here (and pulling it in would drag in mongodb-memory-server).
RUN pnpm install --frozen-lockfile --filter "${APP_PKG}..."

FROM deps AS build
ARG APP_PKG
ARG APP_DIR
# VITE_* values are inlined at build time, so they must be build ARGs.
ARG VITE_GRAPHQL_URL=https://portal-server.exyconn.com/graphql
ARG VITE_PORTAL_APP
ARG VITE_PORTAL_DOMAIN=exyconn.com
ENV VITE_GRAPHQL_URL=${VITE_GRAPHQL_URL}
ENV VITE_PORTAL_APP=${VITE_PORTAL_APP}
ENV VITE_PORTAL_DOMAIN=${VITE_PORTAL_DOMAIN}
COPY tsconfig.base.json ./
COPY packages packages
COPY exyconn-portal/ui exyconn-portal/ui
COPY exyconn-portal/apps exyconn-portal/apps
RUN pnpm --filter "${APP_PKG}" run build

FROM nginx:alpine AS runtime
ARG APP_DIR
ARG PORT
RUN apk add --no-cache wget
COPY --from=build /repo/${APP_DIR}/dist /usr/share/nginx/html
COPY docker/spa.nginx.conf /etc/nginx/templates/default.conf.template
ENV NGINX_PORT=${PORT}
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${NGINX_PORT}/" || exit 1

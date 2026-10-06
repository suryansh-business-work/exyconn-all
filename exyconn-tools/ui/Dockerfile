# =============================================================================
# Exyconn Tools UI - Multi-stage Dockerfile
# Service: tools-ui | Port: 4001 | Domain: tools.exyconn.com
# Build context: the monorepo ROOT (deploy.yml / exyconn-tools/docker-compose.yml), because
# the build reads packages/seo — the zero-dependency head renderer the prerender and the SPA
# share — straight from source through a tsconfig `paths` entry and a Vite alias. The visitor
# chat is not bundled: index.html loads the website's loader (VITE_CHAT_EMBED_URL), which
# opens the chat in an iframe from exyconn.com.
# Tools itself stays an npm project outside the pnpm workspace.
# =============================================================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /repo/exyconn-tools/ui
RUN apk add --no-cache libc6-compat
COPY exyconn-tools/ui/package.json ./
RUN rm -f package-lock.json && npm install --legacy-peer-deps --include=optional

# Stage 2: Builder — same relative layout as the repo, so ../../packages/seo resolves.
FROM node:22-alpine AS builder
WORKDIR /repo/exyconn-tools/ui
RUN apk add --no-cache libc6-compat
COPY packages/seo /repo/packages/seo
COPY --from=deps /repo/exyconn-tools/ui/node_modules ./node_modules
# Includes scripts/ (SEO prerender: build = tsc && vite build && tsx scripts/prerender.ts)
COPY exyconn-tools/ui ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_CHAT_EMBED_URL
ENV VITE_CHAT_EMBED_URL=$VITE_CHAT_EMBED_URL
RUN npm run build

# Stage 3: Production (Nginx)
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built assets
COPY --from=builder /repo/exyconn-tools/ui/dist /usr/share/nginx/html

# Nginx SPA config - Port 4001 (see nginx.conf)
COPY exyconn-tools/ui/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:4001/ || exit 1

EXPOSE 4001

CMD ["nginx", "-g", "daemon off;"]

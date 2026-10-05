# =============================================================================
# Exyconn Tools UI - Multi-stage Dockerfile
# Service: tools-ui | Port: 4001 | Domain: tools.exyconn.com
# Build context: the monorepo ROOT (deploy.yml / exyconn-tools/docker-compose.yml), because
# the build reads packages/seo — the zero-dependency head renderer the prerender and the SPA
# share — and packages/chat-widget (the visitor chat bubble) straight from source through
# tsconfig `paths` entries and Vite aliases.
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
COPY packages/chat-widget /repo/packages/chat-widget
COPY --from=deps /repo/exyconn-tools/ui/node_modules ./node_modules
# Includes scripts/ (SEO prerender: build = tsc && vite build && tsx scripts/prerender.ts)
COPY exyconn-tools/ui ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_CHAT_SOCKET_URL
ENV VITE_CHAT_SOCKET_URL=$VITE_CHAT_SOCKET_URL
RUN npm run build

# Stage 3: Production (Nginx)
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built assets
COPY --from=builder /repo/exyconn-tools/ui/dist /usr/share/nginx/html

# Nginx SPA config - Port 4001
# Prerendered routes live at <path>/index.html: serve that file for /tools/x directly. With
# `$uri/` nginx answered /tools/x with a 301 to its own http://host:4001/tools/x/ (the
# container port), which visitors cannot reach; absolute_redirect off keeps any other
# redirect relative.
RUN echo 'server { \
    listen 4001; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    absolute_redirect off; \
    add_header Permissions-Policy "camera=(), microphone=(self), geolocation=()" always; \
    location / { try_files $uri $uri/index.html /index.html; } \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { expires 1y; add_header Cache-Control "public, immutable"; add_header Permissions-Policy "camera=(), microphone=(self), geolocation=()" always; } \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml; \
    gzip_min_length 256; \
}' > /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:4001/ || exit 1

EXPOSE 4001

CMD ["nginx", "-g", "daemon off;"]

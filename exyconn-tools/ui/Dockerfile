# =============================================================================
# Exyconn Tools UI - Multi-stage Dockerfile
# Service: tools-ui | Port: 4001 | Domain: tools.exyconn.com
# =============================================================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json ./
RUN rm -f package-lock.json && npm install --legacy-peer-deps --include=optional

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
# COPY . . includes scripts/ (SEO prerender: build = tsc && vite build && tsx scripts/prerender.ts)
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 3: Production (Nginx)
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx SPA config - Port 4001
RUN echo 'server { \
    listen 4001; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ { expires 1y; add_header Cache-Control "public, immutable"; } \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml; \
    gzip_min_length 256; \
}' > /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:4001/ || exit 1

EXPOSE 4001

CMD ["nginx", "-g", "daemon off;"]

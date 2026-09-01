# =============================================================================
# Exyconn Tools Server - Multi-stage Dockerfile
# Service: tools-server | Port: 4002 | Domain: tools-api.exyconn.com
# Build: Node16 moduleResolution fix - Feb 2026
# Note: Using node:22-slim (Debian) for glibc compatibility with onnxruntime-node
# =============================================================================

# Stage 1: Dependencies
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json ./
RUN rm -f package-lock.json && npm install --legacy-peer-deps --include=optional

# Stage 2: Builder
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 3: Production
FROM node:22-slim AS production
WORKDIR /app

# Install wget (health check), qpdf (PDF protect/unlock) and LibreOffice + fonts
# (office -> PDF conversion), then create the non-root user
RUN apt-get update && apt-get install -y --no-install-recommends \
        wget \
        qpdf \
        libreoffice-core \
        libreoffice-writer \
        libreoffice-calc \
        libreoffice-impress \
        fonts-dejavu \
        fontconfig && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nodejs && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Copy production files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:4002/health || exit 1

EXPOSE 4002

ENV NODE_ENV=production
ENV PORT=4002
# soffice (LibreOffice) needs a writable HOME for its user profile under the non-root user
ENV HOME=/tmp

CMD ["node", "dist/index.js"]

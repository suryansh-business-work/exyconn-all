# =============================================================================
# Exyconn meeting bot (Meeting Assistant)
# Service: meet-bot | Port: 4050 (health only, not published) | no public domain
# Build context: the monorepo ROOT (the package lives in the pnpm workspace).
#
# Joins Google Meet calls in Chromium on a virtual display (Xvfb), plays the call into a
# PulseAudio null sink, and records both with ffmpeg. It picks up work from the portal server
# (MEET_BOT_TOKEN) and uploads through the extension's own endpoints as the call's owner.
# The bot's Google sign-in lives in the mounted Chrome profile (/data/profile), never here.
# =============================================================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/config/package.json packages/config/
COPY exyconn-meet-bot/package.json exyconn-meet-bot/
# The root `prepare` script runs on every install, this one included; it needs its own file.
COPY scripts/install-git-hooks.mjs scripts/
RUN pnpm install --frozen-lockfile --filter @exyconn/meet-bot...

FROM deps AS build
COPY exyconn-meet-bot exyconn-meet-bot
RUN pnpm --filter @exyconn/meet-bot run build \
  && pnpm --filter @exyconn/meet-bot deploy --prod /app

FROM node:22-alpine AS runtime
# Noto with Devanagari so Hindi in the call (names, chat) renders in the recording.
RUN apk add --no-cache chromium xvfb pulseaudio pulseaudio-utils ffmpeg wget \
      font-noto font-noto-devanagari && \
    addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs -h /home/nodejs && \
    mkdir -p /data/profile /tmp/meet-bot && chown -R nodejs:nodejs /data /tmp/meet-bot
WORKDIR /app
COPY --from=build --chown=nodejs:nodejs /app /app
COPY --chown=nodejs:nodejs exyconn-meet-bot/entrypoint.sh /app/entrypoint.sh
USER nodejs

ENV NODE_ENV=production
ENV PORT=4050
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV HOME=/home/nodejs
EXPOSE 4050
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4050/health || exit 1

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]

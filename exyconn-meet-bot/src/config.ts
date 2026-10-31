/** A required setting: the bot cannot work without it, so it refuses to start. */
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const whole = (name: string, fallback: number) =>
  Number.parseInt(process.env[name] ?? '', 10) || fallback;

/** The bot service's settings. Credentials and per-company choices come from the portal. */
export const config = {
  /** The portal API, e.g. http://portal-server:4004 inside the Docker network. */
  apiUrl: required('PORTAL_API_URL').replace(/\/$/, ''),
  /** The shared secret the portal server's MEET_BOT_TOKEN also holds; empty keeps the bot idle. */
  botToken: process.env.MEET_BOT_TOKEN?.trim() ?? '',
  /** Calls one container records side by side; each takes about 1 CPU and 1 GB of memory. */
  concurrency: whole('MEET_BOT_CONCURRENCY', 2),
  pollMs: whole('MEET_BOT_POLL_MS', 10_000),
  chromePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
  ffmpegPath: process.env.FFMPEG_PATH ?? 'ffmpeg',
  /** The Chrome profile signed in to the bot's Google account (empty: joins as a guest). */
  profileDir: process.env.MEET_BOT_PROFILE_DIR ?? '/data/profile',
  workDir: process.env.MEET_BOT_WORK_DIR ?? '/tmp/meet-bot',
  port: whole('PORT', 4050),
};

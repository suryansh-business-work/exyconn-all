import dotenv from 'dotenv';

dotenv.config();

/** Validated, immutable environment configuration (singleton). */
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = Object.freeze({
  port: Number(process.env.PORT ?? 4004),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:1001',
  /** Public portal URL used as the login CTA inside transactional emails. */
  appUrl: process.env.APP_URL ?? 'https://portal.exyconn.com',
  /**
   * Body limit for /graphql. Raised well above Express's 100kb default because the
   * desktop tracker posts base64 screenshots through it.
   */
  graphqlBodyLimit: process.env.GRAPHQL_BODY_LIMIT ?? '12mb',
  /** Download page for the desktop tracker, used as the CTA in the access-granted email. */
  trackerDownloadUrl: process.env.TRACKER_DOWNLOAD_URL ?? 'https://portal.exyconn.com/tracker',
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME ?? 'Exyconn Admin',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@exyconn.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@1234',
  },
});

export type Env = typeof env;

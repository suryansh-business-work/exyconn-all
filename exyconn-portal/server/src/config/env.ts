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
  /**
   * Origins allowed to call the API. The portal is split into one micro-frontend
   * per module, each on its own subdomain, so this is a comma-separated list.
   */
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:1001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Public portal URL used as the login CTA inside transactional emails. */
  appUrl: process.env.APP_URL ?? 'https://portal.exyconn.com',
  /**
   * Body limit for /graphql. Raised well above Express's 100kb default because the
   * desktop tracker posts base64 screenshots through it. It has to clear
   * TRACKER_LIMITS.maxScreenshotBytes with room for base64's 4/3 inflation, or a capture
   * the tracker module accepts is killed by Express before it ever reaches the resolver.
   */
  graphqlBodyLimit: process.env.GRAPHQL_BODY_LIMIT ?? '36mb',
  /** Download page for the desktop tracker, used as the CTA in the access-granted email. */
  trackerDownloadUrl: process.env.TRACKER_DOWNLOAD_URL ?? 'https://employee.exyconn.com/me/tracker',
  /**
   * Public status page configuration. The monitor probes every active entry in the
   * `statusmonitors` collection on this interval; a reachable endpoint slower than
   * `degradedMs` is reported as degraded rather than operational.
   */
  status: {
    enabled: (process.env.STATUS_MONITOR_ENABLED ?? 'true') !== 'false',
    /** Platform domain the seeded monitor URLs hang off. */
    domain: process.env.STATUS_DOMAIN ?? 'exyconn.com',
    intervalMs: Number(process.env.STATUS_CHECK_INTERVAL_MS ?? 300_000),
    timeoutMs: Number(process.env.STATUS_CHECK_TIMEOUT_MS ?? 10_000),
    degradedMs: Number(process.env.STATUS_DEGRADED_MS ?? 2_000),
  },
  /** Where the payslip email sends an employee to see the rest of their payslips. */
  salarySlipsUrl:
    process.env.SALARY_SLIPS_URL ?? 'https://employee.exyconn.com/me/salary-slips',
  /**
   * Read-only Docker Engine API the Tech portal's Infrastructure screen reads the host
   * and the running stack from. Points at the socket proxy (GET-only) rather than at
   * /var/run/docker.sock: the socket is root on the host, and this process must never
   * be able to change what runs there.
   */
  dockerApiUrl: (process.env.DOCKER_API_URL ?? '').replace(/\/$/, ''),
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME ?? 'Exyconn Admin',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@exyconn.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@1234',
  },
});

export type Env = typeof env;

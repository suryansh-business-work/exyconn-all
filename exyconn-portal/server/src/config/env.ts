import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * JWT secrets that are known to the world — the example file's, the test suite's and the
 * obvious one. A token signed with any of them can be forged by anybody who has read this
 * repository, so production refuses to boot with one.
 */
export const PLACEHOLDER_JWT_SECRETS = new Set([
  'change-me-in-production',
  'test-secret',
  'secret',
]);

/** HS256 wants at least 256 bits of key; 32 characters is the floor for a random secret. */
export const MIN_JWT_SECRET_LENGTH = 32;

const requiredVariable = (key: string) =>
  z.string({ error: `Missing required environment variable: ${key}` }).min(1, {
    error: `Missing required environment variable: ${key}`,
  });

/** The variables whose values decide whether this process is safe to expose at all. */
const environmentSchema = z.object({
  NODE_ENV: z.string().optional(),
  MONGODB_URI: requiredVariable('MONGODB_URI'),
  JWT_SECRET: requiredVariable('JWT_SECRET'),
  CORS_ORIGIN: z.string().optional(),
});

type EnvironmentValues = z.infer<typeof environmentSchema>;

/** The validated variables, plus what is wrong but not worth refusing to boot over. */
export interface EnvironmentReport {
  values: EnvironmentValues;
  warnings: string[];
}

/** Throws on what production must never run with; returns what it should only shout about. */
function productionWarnings(values: EnvironmentValues): string[] {
  if (PLACEHOLDER_JWT_SECRETS.has(values.JWT_SECRET)) {
    throw new Error('JWT_SECRET is a published placeholder; set a long random secret');
  }
  const origins = (values.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim());
  if (!origins.some(Boolean)) {
    throw new Error('CORS_ORIGIN must list the portal origins in production');
  }
  if (origins.includes('*')) {
    throw new Error("CORS_ORIGIN must not contain '*' in production (credentials are sent)");
  }
  // Not fatal on purpose: the deployed secret's length cannot be checked from here, and
  // refusing to boot would take production down. Loud instead, until it is rotated.
  if (values.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    return [
      `JWT_SECRET is shorter than ${MIN_JWT_SECRET_LENGTH} characters; rotate it to a long random value`,
    ];
  }
  return [];
}

/**
 * Checks the security-relevant variables. Throws when the process must not start (a missing
 * variable, a forgeable JWT secret, a wildcard CORS list in production); returns the
 * problems that are only worth shouting about. Exported so the rules can be tested against
 * a production-shaped environment without re-importing this module.
 */
export function validateEnvironment(source: NodeJS.ProcessEnv): EnvironmentReport {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
  }
  const values = parsed.data;
  if (values.NODE_ENV === 'production') {
    return { values, warnings: productionWarnings(values) };
  }
  if (values.NODE_ENV) {
    return { values, warnings: [] };
  }
  return {
    values,
    warnings: ['NODE_ENV is not set; running with development defaults (Docker sets production)'],
  };
}

const report = validateEnvironment(process.env);
// The logger reads this module, so the report goes to stderr directly rather than to pino.
for (const warning of report.warnings) {
  console.error(`[env] ${warning}`);
}

/** Validated, immutable environment configuration (singleton). */
export const env = Object.freeze({
  port: Number(process.env.PORT ?? 4004),
  nodeEnv: report.values.NODE_ENV ?? 'development',
  isProduction: report.values.NODE_ENV === 'production',
  mongoUri: report.values.MONGODB_URI,
  jwtSecret: report.values.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  /**
   * Origins allowed to call the API. The portal is split into one micro-frontend
   * per module, each on its own subdomain, so this is a comma-separated list.
   */
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:1001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /**
   * The API's own public address. Social sign-in providers send the browser back to it after
   * consent (`/oauth/social/<app>/callback`), so it must be the URL registered with each one.
   */
  apiPublicUrl: (process.env.API_PUBLIC_URL ?? 'https://portal-server.exyconn.com').replace(
    /\/$/,
    '',
  ),
  /** Public portal URL used as the login CTA inside transactional emails. */
  appUrl: process.env.APP_URL ?? 'https://portal.exyconn.com',
  /**
   * Where a self-service password reset link opens when the request did not come from a
   * portal origin CORS trusts (a curl, say). A request from a portal links back to itself.
   */
  portalHubUrl: process.env.PORTAL_HUB_URL ?? 'https://portal.exyconn.com',
  /**
   * Body limit for /graphql. Raised well above Express's 100kb default because the
   * desktop tracker posts base64 screenshots through it, and set to the host nginx's
   * `client_max_body_size 15m` (deploy/nginx) — nothing larger can arrive in production,
   * so buffering more here only gives a direct caller a bigger allocation to abuse.
   *
   * base64 inflates 4/3, so 15mb carries a screenshot of about 11MB decoded. That is BELOW
   * TRACKER_LIMITS.maxScreenshotBytes (24MB) and the tracker's MAX_CAPTURE_BYTES (20MB): a
   * capture between ~11MB and 20MB is refused with a 413 by the perimeter, not by the
   * resolver. Raise nginx and this together if lossless retina captures must get through.
   */
  graphqlBodyLimit: process.env.GRAPHQL_BODY_LIMIT ?? '15mb',
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
    /**
     * Consecutive failed probes before an incident opens. One failed probe is often a
     * blip; alerting on it pages people for nothing.
     */
    failuresToOpen: Number(process.env.STATUS_FAILURES_TO_OPEN ?? 2),
  },
  /**
   * Where a project share link opens. The read-only client view lives on the public status
   * site, which is the one app with no sign-in and no portal chrome.
   */
  projectShareBaseUrl: (process.env.PROJECT_SHARE_BASE_URL ?? 'https://status.exyconn.com').replace(
    /\/$/,
    '',
  ),
  /** Where a support reply email sends the employee to read the thread. */
  employeeSupportUrl: process.env.EMPLOYEE_SUPPORT_URL ?? 'https://employee.exyconn.com/me/support',
  /** Where the payslip email sends an employee to see the rest of their payslips. */
  salarySlipsUrl: process.env.SALARY_SLIPS_URL ?? 'https://employee.exyconn.com/me/salary-slips',
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
    /**
     * Only for creating the bootstrap account on an empty database. No default: a password
     * in this repository is a password everybody knows, so without one no account is made.
     */
    password: process.env.SEED_ADMIN_PASSWORD || null,
  },
});

export type Env = typeof env;

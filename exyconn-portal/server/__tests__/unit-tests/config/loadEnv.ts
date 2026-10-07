import { randomBytes } from 'node:crypto';

export type EnvModule = typeof import('../../../src/config/env');

/** Every optional variable env.ts reads, so a test can pin each one to set or unset. */
const OPTIONAL_KEYS = [
  'PORT',
  'JWT_EXPIRES_IN',
  'CORS_ORIGIN',
  'API_PUBLIC_URL',
  'APP_URL',
  'WHATSAPP_DEMO_URL',
  'WEBSITE_URL',
  'CHAT_KNOWLEDGE_MARKET',
  'CHAT_ORIGINS',
  'WEBSITE_SERVER_IP',
  'WEBSITE_CHAT_CONSOLE_URL',
  'CLIENT_HUB_URL',
  'PORTAL_HUB_URL',
  'GRAPHQL_BODY_LIMIT',
  'BACKUP_STATUS_FILE',
  'TRACKER_DOWNLOAD_URL',
  'STATUS_MONITOR_ENABLED',
  'STATUS_DOMAIN',
  'STATUS_CHECK_INTERVAL_MS',
  'STATUS_CHECK_TIMEOUT_MS',
  'STATUS_DEGRADED_MS',
  'STATUS_FAILURES_TO_OPEN',
  'SSL_WARNING_DAYS',
  'SSL_CHECK_TIMEOUT_MS',
  'PROJECT_SHARE_BASE_URL',
  'EMPLOYEE_SUPPORT_URL',
  'SALARY_SLIPS_URL',
  'DOCKER_API_URL',
  'SEED_ADMIN_NAME',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
] as const;

/** A secret generated per run, so none lives in the test. */
export const secret = (bytes: number) => randomBytes(bytes).toString('hex');

/** Loads a fresh copy of env.ts against exactly these variables, then restores the process. */
export function loadEnv(vars: Record<string, string | undefined>): EnvModule {
  const snapshot = { ...process.env };
  for (const key of OPTIONAL_KEYS) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  let loaded: EnvModule | undefined;
  try {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      loaded = require('../../../src/config/env') as EnvModule;
    });
  } finally {
    process.env = snapshot;
  }
  if (!loaded) {
    throw new Error('env.ts did not load');
  }
  return loaded;
}

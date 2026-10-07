import { loadEnv, secret } from './loadEnv';

jest.mock('dotenv', () => ({ config: jest.fn() }));

let stderr: jest.SpyInstance;
beforeEach(() => {
  stderr = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => stderr.mockRestore());

describe('the env singleton', () => {
  it('uses the documented defaults when nothing optional is set', () => {
    const { env } = loadEnv({ NODE_ENV: 'test' });
    expect(env).toMatchObject({
      port: 4004,
      nodeEnv: 'test',
      isProduction: false,
      mongoUri: process.env.MONGODB_URI,
      jwtExpiresIn: '7d',
      corsOrigins: ['http://localhost:1001'],
      apiPublicUrl: 'https://portal-server.exyconn.com',
      websiteUrl: 'https://exyconn.com',
      chatOrigins: ['https://exyconn.com', 'https://tools.exyconn.com'],
      websiteServerIp: '',
      graphqlBodyLimit: '15mb',
      backupStatusFile: '',
      dockerApiUrl: '',
      status: { enabled: true, domain: 'exyconn.com', intervalMs: 300_000, failuresToOpen: 2 },
      security: { sslWarningDays: 30, sslTimeoutMs: 8_000 },
      seedAdmin: { name: 'Exyconn Admin', email: 'admin@exyconn.com', password: null },
    });
    expect(Object.isFrozen(env)).toBe(true);
    expect(stderr).not.toHaveBeenCalled();
  });

  it('reads every override, trimming lists and trailing slashes', () => {
    const seedPassword = secret(8);
    const { env } = loadEnv({
      NODE_ENV: 'test',
      PORT: '5005',
      JWT_EXPIRES_IN: '1h',
      CORS_ORIGIN: ' https://a.test , ,https://b.test',
      API_PUBLIC_URL: 'https://api.test/',
      APP_URL: 'https://app.test',
      WHATSAPP_DEMO_URL: 'https://wa.test',
      WEBSITE_URL: 'https://site.test/',
      CHAT_KNOWLEDGE_MARKET: 'en-gb',
      CHAT_ORIGINS: 'https://chat.test, ',
      WEBSITE_SERVER_IP: '192.0.2.10',
      WEBSITE_CHAT_CONSOLE_URL: 'https://console.test/',
      CLIENT_HUB_URL: 'https://hub.test/',
      PORTAL_HUB_URL: 'https://portal.test',
      GRAPHQL_BODY_LIMIT: '1mb',
      BACKUP_STATUS_FILE: '/backup/status.json',
      TRACKER_DOWNLOAD_URL: 'https://download.test',
      STATUS_MONITOR_ENABLED: 'false',
      STATUS_DOMAIN: 'status.test',
      STATUS_CHECK_INTERVAL_MS: '1000',
      STATUS_CHECK_TIMEOUT_MS: '500',
      STATUS_DEGRADED_MS: '250',
      STATUS_FAILURES_TO_OPEN: '4',
      SSL_WARNING_DAYS: '7',
      SSL_CHECK_TIMEOUT_MS: '900',
      PROJECT_SHARE_BASE_URL: 'https://share.test/',
      EMPLOYEE_SUPPORT_URL: 'https://support.test',
      SALARY_SLIPS_URL: 'https://slips.test',
      DOCKER_API_URL: 'http://docker.test:2375/',
      SEED_ADMIN_NAME: 'Root',
      SEED_ADMIN_EMAIL: 'root@site.test',
      SEED_ADMIN_PASSWORD: seedPassword,
    });
    expect(env).toMatchObject({
      port: 5005,
      jwtExpiresIn: '1h',
      corsOrigins: ['https://a.test', 'https://b.test'],
      apiPublicUrl: 'https://api.test',
      appUrl: 'https://app.test',
      whatsappDemoUrl: 'https://wa.test',
      websiteUrl: 'https://site.test',
      chatKnowledgeMarket: 'en-gb',
      chatOrigins: ['https://chat.test'],
      websiteServerIp: '192.0.2.10',
      websiteChatConsoleUrl: 'https://console.test',
      clientHubUrl: 'https://hub.test',
      portalHubUrl: 'https://portal.test',
      graphqlBodyLimit: '1mb',
      backupStatusFile: '/backup/status.json',
      trackerDownloadUrl: 'https://download.test',
      status: {
        enabled: false,
        domain: 'status.test',
        intervalMs: 1000,
        timeoutMs: 500,
        degradedMs: 250,
        failuresToOpen: 4,
      },
      security: { sslWarningDays: 7, sslTimeoutMs: 900 },
      projectShareBaseUrl: 'https://share.test',
      employeeSupportUrl: 'https://support.test',
      salarySlipsUrl: 'https://slips.test',
      dockerApiUrl: 'http://docker.test:2375',
      seedAdmin: { name: 'Root', email: 'root@site.test', password: seedPassword },
    });
  });
});

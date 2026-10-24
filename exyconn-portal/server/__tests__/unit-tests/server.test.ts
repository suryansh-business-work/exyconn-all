import { asArg } from '../mockAs';
/* eslint-disable @typescript-eslint/no-require-imports */
type Mocked = Record<string, jest.Mock>;

jest.mock('../../src/lib/tenant', () => ({
  assertTenantCoverage: jest.fn(),
  dropPlatformWideUniqueIndexes: jest.fn().mockResolvedValue([]),
  runAsPlatform: jest.fn((fn: () => unknown) => fn()),
}));
jest.mock('../../src/modules/organizations', () => ({
  ensurePlatformOperatorOrganization: jest.fn().mockResolvedValue(undefined),
  forEachOrganization: jest.fn(async (fn: () => unknown) => {
    await fn();
  }),
  migrateLegacyDataIntoFirstOrganization: jest.fn().mockResolvedValue(undefined),
  repairStoredCurrencies: jest.fn(),
}));
jest.mock('../../src/app', () => ({ createApp: jest.fn() }));
jest.mock('../../src/config/database', () => ({ database: { connect: jest.fn() } }));
jest.mock('../../src/config/env', () => ({ env: { port: 4321 } }));
jest.mock('../../src/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('../../src/seed/ensureAdminAccess', () => ({ ensureAdminAccess: jest.fn() }));
jest.mock('../../src/modules/status', () => ({
  ensureStatusMonitors: jest.fn(),
  startStatusMonitor: jest.fn(),
}));
jest.mock('../../src/modules/email', () => ({ ensureEmailDefaults: jest.fn() }));
jest.mock('../../src/modules/support', () => ({
  ensureSupportSlaPolicies: jest.fn(),
  startInboundMail: jest.fn(),
}));
jest.mock('../../src/modules/payroll', () => ({
  ensureTaxSlabs: jest.fn(),
  startPayrollDispatch: jest.fn(),
}));
jest.mock('../../src/modules/onboarding', () => ({ ensureOnboardingDefaults: jest.fn() }));
jest.mock('../../src/modules/tracker', () => ({
  startEmployeeReports: jest.fn(),
  startTrackerDigest: jest.fn(),
  startTrackerRetention: jest.fn(),
}));
jest.mock('../../src/modules/marketing', () => ({ startCampaignSchedule: jest.fn() }));
jest.mock('../../src/modules/finance', () => ({
  startOverdueSweep: jest.fn(),
  startRecurringInvoiceSchedule: jest.fn(),
}));
jest.mock('../../src/modules/social-accounts', () => ({ startSocialSchedule: jest.fn() }));
jest.mock('../../src/modules/integrations', () => ({ startWebhookDelivery: jest.fn() }));
jest.mock('../../src/modules/ai', () => ({
  ensureAiModelPrices: jest.fn(),
  startAiWorker: jest.fn(),
}));
jest.mock('../../src/modules/meeting-assistant', () => ({
  startMeetingAssistantWorker: jest.fn(),
}));
jest.mock('../../src/modules/logs', () => ({ backfillAppLogGroupUsers: jest.fn() }));
jest.mock('../../src/modules/hr', () => ({ backfillPositionDefaults: jest.fn() }));
jest.mock('../../src/lib/migrations', () => ({
  runOnce: jest.fn((_name: string, work: () => unknown) => work()),
}));
jest.mock('../../src/modules/clients', () => ({ migrateClientTaxIds: jest.fn() }));
jest.mock('../../src/modules/gmail', () => ({ migrateLegacyGmailConnection: jest.fn() }));
jest.mock('../../src/modules/crm-integrations/crm-mailboxes.migrate', () => ({
  assignMailboxesToOperator: jest.fn(),
}));
jest.mock('../../src/modules/my-mailboxes', () => ({ allowPersonalMailboxes: jest.fn() }));
jest.mock('../../src/modules/crm/crm.origin.backfill', () => ({ backfillCrmOrigins: jest.fn() }));
jest.mock('../../src/modules/crm/crm.domain.repair', () => ({
  allowBlankCompanyDomains: jest.fn(),
  clearInventedCompanyDomains: jest.fn(),
}));
jest.mock('../../src/modules/marketing/marketing.migrate', () => ({
  migrateLegacyAudiences: jest.fn(),
  backfillSuppressionOrigins: jest.fn(),
  migrateLegacyCampaigns: jest.fn(),
}));
jest.mock('../../src/modules/crm/crm.deal-closed.backfill', () => ({
  backfillDealClosedAt: jest.fn(),
}));
jest.mock('../../src/modules/crm/calendar/crm.reminder.email', () => ({
  startCrmReminderEmails: jest.fn(),
}));
jest.mock('../../src/modules/cms', () => ({ ensureCmsDefaults: jest.fn() }));
jest.mock('../../src/modules/calling-bot-demo', () => ({
  migratePhoneProvider: jest.fn(),
  backfillPhoneFields: jest.fn(),
  ensureCallingBotScenarios: jest.fn(),
}));
jest.mock('../../src/modules/reminders', () => ({ startReminderSweep: jest.fn() }));
jest.mock('../../src/modules/table-transfer', () => ({ startTableBulkJobs: jest.fn() }));
jest.mock('../../src/modules/audit', () => ({ startAuditRetention: jest.fn() }));
jest.mock('../../src/modules/tech/tracker-releases.service', () => ({
  startTrackerBuildRetention: jest.fn(),
}));
jest.mock('../../src/modules/meeting-assistant/releases.cleanup', () => ({
  startReleaseRetention: jest.fn(),
}));
jest.mock('../../../../demos/whatsapp-demo/server/src', () => ({
  ensureWhatsappDemoSeeds: jest.fn(),
}));
jest.mock('../../../../demos/whatsapp-demo/server/src/channel', () => ({
  startWhatsappReminders: jest.fn(),
}));
jest.mock('../../src/modules/website-chat', () => ({
  attachChatSocket: jest.fn(),
  startChatHandoff: jest.fn(),
}));

const MODULES = {
  tenant: '../../src/lib/tenant',
  organizations: '../../src/modules/organizations',
  app: '../../src/app',
  migrations: '../../src/lib/migrations',
  chat: '../../src/modules/website-chat',
  ai: '../../src/modules/ai',
  logs: '../../src/modules/logs',
  hr: '../../src/modules/hr',
  clients: '../../src/modules/clients',
  gmail: '../../src/modules/gmail',
  mailboxes: '../../src/modules/crm-integrations/crm-mailboxes.migrate',
  myMailboxes: '../../src/modules/my-mailboxes',
  crmOrigins: '../../src/modules/crm/crm.origin.backfill',
  crmDomains: '../../src/modules/crm/crm.domain.repair',
  marketingMigrate: '../../src/modules/marketing/marketing.migrate',
  dealClosed: '../../src/modules/crm/crm.deal-closed.backfill',
  callingBot: '../../src/modules/calling-bot-demo',
} as const;

type Loaded = Record<keyof typeof MODULES, Mocked> & {
  connect: jest.Mock;
  log: Mocked;
  starters: jest.Mock[];
};

const STARTERS: Array<[string, string]> = [
  ['../../src/modules/status', 'startStatusMonitor'],
  ['../../src/modules/payroll', 'startPayrollDispatch'],
  ['../../src/modules/tracker', 'startTrackerRetention'],
  ['../../src/modules/tech/tracker-releases.service', 'startTrackerBuildRetention'],
  ['../../src/modules/meeting-assistant/releases.cleanup', 'startReleaseRetention'],
  ['../../src/modules/tracker', 'startTrackerDigest'],
  ['../../src/modules/tracker', 'startEmployeeReports'],
  ['../../src/modules/marketing', 'startCampaignSchedule'],
  ['../../src/modules/social-accounts', 'startSocialSchedule'],
  ['../../src/modules/finance', 'startRecurringInvoiceSchedule'],
  ['../../src/modules/finance', 'startOverdueSweep'],
  ['../../src/modules/integrations', 'startWebhookDelivery'],
  ['../../src/modules/support', 'startInboundMail'],
  ['../../../../demos/whatsapp-demo/server/src/channel', 'startWhatsappReminders'],
  ['../../src/modules/table-transfer', 'startTableBulkJobs'],
  ['../../src/modules/website-chat', 'startChatHandoff'],
  ['../../src/modules/ai', 'startAiWorker'],
  ['../../src/modules/meeting-assistant', 'startMeetingAssistantWorker'],
  ['../../src/modules/reminders', 'startReminderSweep'],
  ['../../src/modules/crm/calendar/crm.reminder.email', 'startCrmReminderEmails'],
  ['../../src/modules/audit', 'startAuditRetention'],
];

const httpServer = { close: jest.fn() };

/** Loads a fresh server.ts (which boots on import) against fresh mocks, and lets it finish. */
async function boot(databaseFails = false): Promise<Loaded> {
  let loaded: Loaded | undefined;
  jest.isolateModules(() => {
    const mods = Object.fromEntries(
      Object.entries(MODULES).map(([key, path]) => [key, require(path) as Mocked]),
    ) as Record<keyof typeof MODULES, Mocked>;
    const connect = (require('../../src/config/database') as { database: Mocked }).database.connect;
    const log = (require('../../src/utils/logger') as { logger: Mocked }).logger;
    connect.mockImplementation(() =>
      databaseFails ? Promise.reject(new Error('no database')) : Promise.resolve(),
    );
    mods.app.createApp.mockResolvedValue({
      listen: jest.fn((_port: number, ready: () => void) => {
        ready();
        return httpServer;
      }),
    });
    const starters = STARTERS.map(([path, name]) => (require(path) as Mocked)[name]);
    loaded = { ...mods, connect, log, starters };
    require('../../src/server');
  });
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  if (!loaded) throw new Error('server.ts did not load');
  return loaded;
}

let exit: jest.SpyInstance;
beforeEach(() => {
  exit = jest.spyOn(process, 'exit').mockImplementation(asArg(() => undefined));
});
afterEach(() => exit.mockRestore());

describe('server bootstrap', () => {
  it('connects, repairs, seeds, starts every loop and then listens', async () => {
    const m = await boot();
    const order = (mock: jest.Mock) => mock.mock.invocationCallOrder[0];

    expect(order(m.connect)).toBeLessThan(order(m.tenant.assertTenantCoverage));
    expect(order(m.tenant.assertTenantCoverage)).toBeLessThan(
      order(m.organizations.migrateLegacyDataIntoFirstOrganization),
    );
    expect(m.tenant.dropPlatformWideUniqueIndexes).toHaveBeenCalled();
    expect(m.organizations.ensurePlatformOperatorOrganization).toHaveBeenCalled();
    for (const starter of m.starters) {
      expect(starter).toHaveBeenCalledTimes(1);
      expect(order(starter)).toBeLessThan(order(m.app.createApp));
    }
    expect(order(m.ai.ensureAiModelPrices)).toBeLessThan(order(m.ai.startAiWorker));
    expect(m.log.info).toHaveBeenCalledWith(
      'GraphQL server ready at http://localhost:4321/graphql',
    );
    expect(m.chat.attachChatSocket).toHaveBeenCalledWith(httpServer);
    expect(exit).not.toHaveBeenCalled();
  });

  it('runs each company repair through the ledger, once per company', async () => {
    const m = await boot();
    expect(m.migrations.runOnce.mock.calls.map(([name]) => name)).toEqual([
      'app-log-group-users',
      'position-defaults',
      'client-tax-ids',
      'gmail-multi-account',
      'crm-mailboxes-per-organization',
      'mailbox-personal-owner',
      'crm-record-origins',
      'crm-company-blank-domains',
      'crm-company-invented-domains',
      'marketing-audience-builder',
      'marketing-suppression-origins',
      'marketing-email-studio',
      'crm-deal-closed-at',
      'calling-bot-phone-provider',
      'calling-bot-phone-fields',
    ]);
    expect(m.logs.backfillAppLogGroupUsers).toHaveBeenCalled();
    expect(m.hr.backfillPositionDefaults).toHaveBeenCalled();
    expect(m.clients.migrateClientTaxIds).toHaveBeenCalled();
    expect(m.gmail.migrateLegacyGmailConnection).toHaveBeenCalled();
    expect(m.mailboxes.assignMailboxesToOperator).toHaveBeenCalled();
    expect(m.myMailboxes.allowPersonalMailboxes).toHaveBeenCalled();
    expect(m.crmOrigins.backfillCrmOrigins).toHaveBeenCalled();
    expect(m.crmDomains.allowBlankCompanyDomains.mock.invocationCallOrder[0]).toBeLessThan(
      m.crmDomains.clearInventedCompanyDomains.mock.invocationCallOrder[0],
    );
    expect(m.marketingMigrate.migrateLegacyAudiences).toHaveBeenCalled();
    expect(m.marketingMigrate.backfillSuppressionOrigins).toHaveBeenCalled();
    expect(m.marketingMigrate.migrateLegacyCampaigns).toHaveBeenCalled();
    expect(m.dealClosed.backfillDealClosedAt).toHaveBeenCalled();
    expect(m.callingBot.migratePhoneProvider).toHaveBeenCalled();
    expect(m.callingBot.backfillPhoneFields).toHaveBeenCalled();
    expect(m.callingBot.ensureCallingBotScenarios).toHaveBeenCalled();
    expect(m.organizations.forEachOrganization.mock.calls.map(([, label]) => label)).toEqual([
      'repairStoredCurrencies',
      'ensureEmailDefaults',
      'ensureOnboardingDefaults',
      'ensureSupportSlaPolicies',
      'ensureTaxSlabs',
      'backfillPositionDefaults',
      'migrateClientTaxIds',
      'backfillCrmOrigins',
      'clearInventedCompanyDomains',
      'migrateLegacyAudiences',
      'backfillSuppressionOrigins',
      'migrateLegacyCampaigns',
      'backfillDealClosedAt',
      'ensureWhatsappDemoSeeds',
    ]);
    // Admin access, the log-group backfill, status monitors, the Gmail account migration, the
    // mailboxes' move into the operator, their per-owner index swap, the company domain index
    // swap, the two calling bot migrations, its example seeds and AI model prices run for the
    // platform rather than for each company.
    expect(m.tenant.runAsPlatform).toHaveBeenCalledTimes(11);
  });

  it('logs and exits when the database cannot be reached, serving nothing', async () => {
    const m = await boot(true);
    expect(m.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'no database' }),
      'Failed to start server',
    );
    expect(exit).toHaveBeenCalledWith(1);
    expect(m.tenant.assertTenantCoverage).not.toHaveBeenCalled();
    expect(m.app.createApp).not.toHaveBeenCalled();
  });
});

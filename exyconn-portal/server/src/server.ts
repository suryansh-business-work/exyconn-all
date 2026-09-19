// FIRST: every model must be defined with its organization scope already installed.
import { assertTenantCoverage, dropPlatformWideUniqueIndexes, runAsPlatform } from './lib/tenant';
import {
  ensurePlatformOperatorOrganization,
  forEachOrganization,
  migrateLegacyDataIntoFirstOrganization,
  repairStoredCurrencies,
} from './modules/organizations';
import { createApp } from './app';
import { database } from './config/database';
import { ensureAdminAccess } from './seed/ensureAdminAccess';
import { ensureStatusMonitors, startStatusMonitor } from './modules/status';
import { ensureEmailDefaults } from './modules/email';
import { ensureSupportSlaPolicies, startInboundMail } from './modules/support';
import { ensureTaxSlabs, startPayrollDispatch } from './modules/payroll';
import { ensureOnboardingDefaults } from './modules/onboarding';
import { startTrackerDigest, startTrackerRetention } from './modules/tracker';
import { startCampaignSchedule } from './modules/marketing';
import { startOverdueSweep, startRecurringInvoiceSchedule } from './modules/finance';
import { startWebhookDelivery } from './modules/integrations';
import { ensureAiModelPrices, startAiWorker } from './modules/ai';
import { backfillAppLogGroupUsers } from './modules/logs';
import { startReminderSweep } from './modules/reminders';
import { env } from './config/env';
import { logger } from './utils/logger';

/** Process entrypoint: connect to MongoDB, then start the HTTP/GraphQL server. */
async function bootstrap(): Promise<void> {
  await database.connect();
  // Every model is either one company's data or deliberately the platform's — refuse to
  // serve at all if one was defined before the scope was installed (see lib/tenant/install).
  assertTenantCoverage();
  // An install that predates the tenancy is moved into its first organization before anything
  // serves a request — its records would otherwise be invisible to the company they belong to.
  await migrateLegacyDataIntoFirstOrganization();
  // A collection created before the tenancy may still carry a platform-wide unique index,
  // which refuses one company a name only another company uses. Drop any such stray.
  await dropPlatformWideUniqueIndexes();
  // Exyconn's own staff manage what every company shares from inside the first company, so
  // exactly one organization is flagged as the platform operator (see lib/platformAccess).
  await ensurePlatformOperatorOrganization();
  // Money stored with '' or '₹' as its currency crashed every screen that formatted it, so
  // it is rewritten to ISO 4217 before anything serves a request. Only wrong records change.
  await forEachOrganization(repairStoredCurrencies, 'repairStoredCurrencies');
  // A portal nobody can administer is unusable, so make that state unreachable
  // on a fresh install and self-healing on an existing one.
  await runAsPlatform(ensureAdminAccess);
  // Log groups stored without a last user would fail the Tech > Logs grid.
  await runAsPlatform(backfillAppLogGroupUsers);
  // The public status page is only as good as its catalogue, so make sure every
  // surface has a monitor row before the first probe round runs.
  await runAsPlatform(ensureStatusMonitors);
  // A template referenced from code must exist, or the first thing that tries to send it
  // fails on a fresh install. Seeded only when absent, so portal edits survive a restart.
  await forEachOrganization(ensureEmailDefaults, 'ensureEmailDefaults');
  // A company that has just installed the portal has to be able to onboard somebody on day
  // one, so the standard checklist exists before anybody has written one. Insert-only, so
  // an HR lead's edits survive every restart.
  await forEachOrganization(ensureOnboardingDefaults, 'ensureOnboardingDefaults');
  // A ticket with no policy behind it carries no deadline, so the desk starts with the
  // default promises in place. Insert-only: a policy the team retuned is left alone.
  await forEachOrganization(ensureSupportSlaPolicies, 'ensureSupportSlaPolicies');
  // SLAB mode has to compute something on a fresh install, so one year's income-tax table
  // exists before the first payroll run. Insert-only, and every figure in it is editable in
  // HR > Tax Slabs — it is a starting point to check against the finance act, not a rate
  // this repository is asserting.
  await forEachOrganization(ensureTaxSlabs, 'ensureTaxSlabs');
  startStatusMonitor();
  // Payslips go out on the schedule HR sets in the portal, so the loop has to be running
  // even in a month nobody signs in.
  startPayrollDispatch();
  // Screenshots expire on the workspace's own retention window, so the purge has to run
  // even in a week nobody opens the Tracker console.
  startTrackerRetention();
  // The daily/weekly tracker summary is a scheduled email like the payslips above, so it
  // needs the loop running whether or not anyone opens the portal.
  startTrackerDigest();
  // A campaign scheduled for Tuesday morning has to go out on Tuesday morning, whether or
  // not anyone is signed into the Marketing portal when it does.
  startCampaignSchedule();
  startRecurringInvoiceSchedule();
  // Before the reminder sweep below, which tells finance about whatever this has just
  // declared overdue: started in this order, an invoice that fell due overnight is marked,
  // chased and notified on the same boot rather than an hour apart.
  startOverdueSweep();
  startWebhookDelivery();
  // Mail sent to the support address has to become a ticket even when nobody is watching
  // the mailbox, so the importer runs on the same terms as the schedulers above.
  startInboundMail();
  // A run with no price on file costs zero, so the prices have to exist before the first
  // job does. Insert-only, so a price corrected in Tech survives every restart.
  await runAsPlatform(ensureAiModelPrices);
  // AI jobs are queued rather than run inside the request that asked for them, so
  // something has to drain the queue whether or not anyone has the AI module open.
  startAiWorker();
  // Due dates are the one thing in the portal nobody is watching: a contract expires, a
  // corrective action falls overdue, a follow-up is missed, and the record simply sits
  // there. The sweep asks every module what has come due and tells the people who own it.
  startReminderSweep();
  const app = await createApp();
  app.listen(env.port, () => {
    logger.info(`GraphQL server ready at http://localhost:${env.port}/graphql`);
  });
}

bootstrap().catch((error) => {
  logger.error(error, 'Failed to start server');
  process.exit(1);
});

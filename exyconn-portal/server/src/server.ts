import { createApp } from './app';
import { database } from './config/database';
import { ensureAdminAccess } from './seed/ensureAdminAccess';
import { ensureStatusMonitors, startStatusMonitor } from './modules/status';
import { ensureEmailDefaults } from './modules/email';
import { ensureSupportSlaPolicies } from './modules/support';
import { startPayrollDispatch } from './modules/payroll';
import { ensureOnboardingDefaults } from './modules/onboarding';
import { startTrackerDigest, startTrackerRetention } from './modules/tracker';
import { startCampaignSchedule } from './modules/marketing';
import { startRecurringInvoiceSchedule } from './modules/finance';
import { startWebhookDelivery } from './modules/integrations';
import { ensureAiModelPrices, startAiWorker } from './modules/ai';
import { env } from './config/env';
import { logger } from './utils/logger';

/** Process entrypoint: connect to MongoDB, then start the HTTP/GraphQL server. */
async function bootstrap(): Promise<void> {
  await database.connect();
  // A portal nobody can administer is unusable, so make that state unreachable
  // on a fresh install and self-healing on an existing one.
  await ensureAdminAccess();
  // The public status page is only as good as its catalogue, so make sure every
  // surface has a monitor row before the first probe round runs.
  await ensureStatusMonitors();
  // A template referenced from code must exist, or the first thing that tries to send it
  // fails on a fresh install. Seeded only when absent, so portal edits survive a restart.
  await ensureEmailDefaults();
  // A company that has just installed the portal has to be able to onboard somebody on day
  // one, so the standard checklist exists before anybody has written one. Insert-only, so
  // an HR lead's edits survive every restart.
  await ensureOnboardingDefaults();
  // A ticket with no policy behind it carries no deadline, so the desk starts with the
  // default promises in place. Insert-only: a policy the team retuned is left alone.
  await ensureSupportSlaPolicies();
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
  startWebhookDelivery();
  // A run with no price on file costs zero, so the prices have to exist before the first
  // job does. Insert-only, so a price corrected in Tech survives every restart.
  await ensureAiModelPrices();
  // AI jobs are queued rather than run inside the request that asked for them, so
  // something has to drain the queue whether or not anyone has the AI module open.
  startAiWorker();
  const app = await createApp();
  app.listen(env.port, () => {
    logger.info(`GraphQL server ready at http://localhost:${env.port}/graphql`);
  });
}

bootstrap().catch((error) => {
  logger.error(error, 'Failed to start server');
  process.exit(1);
});

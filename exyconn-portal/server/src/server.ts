import { createApp } from './app';
import { database } from './config/database';
import { ensureAdminAccess } from './seed/ensureAdminAccess';
import { ensureStatusMonitors, startStatusMonitor } from './modules/status';
import { ensureEmailDefaults } from './modules/email';
import { startPayrollDispatch } from './modules/payroll';
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
  startStatusMonitor();
  // Payslips go out on the schedule HR sets in the portal, so the loop has to be running
  // even in a month nobody signs in.
  startPayrollDispatch();
  const app = await createApp();
  app.listen(env.port, () => {
    logger.info(`GraphQL server ready at http://localhost:${env.port}/graphql`);
  });
}

bootstrap().catch((error) => {
  logger.error(error, 'Failed to start server');
  process.exit(1);
});

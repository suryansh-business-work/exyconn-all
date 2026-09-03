import { createApp } from './app';
import { database } from './config/database';
import { ensureAdminAccess } from './seed/ensureAdminAccess';
import { ensureStatusMonitors, startStatusMonitor } from './modules/status';
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
  startStatusMonitor();
  const app = await createApp();
  app.listen(env.port, () => {
    logger.info(`GraphQL server ready at http://localhost:${env.port}/graphql`);
  });
}

bootstrap().catch((error) => {
  logger.error(error, 'Failed to start server');
  process.exit(1);
});

import '../lib/tenant/install';
import { database } from '../config/database';
import { migrateLegacyDataIntoFirstOrganization } from '../modules/organizations';
import { logger } from '../utils/logger';
import '../graphql';

/**
 * Runs the move into the first organization by hand. The server does this itself at boot
 * (see server.ts), so this exists for a migration run outside a deploy — a restore, or a
 * database somebody wants to bring across before starting the app.
 *
 *   pnpm --filter exyconn-portal-server exec tsx src/scripts/migrate-to-organizations.ts
 */
async function run(): Promise<void> {
  await database.connect();
  await migrateLegacyDataIntoFirstOrganization();
  await database.disconnect();
}

run().catch((error: unknown) => {
  logger.error(error, 'Migration failed');
  process.exit(1);
});

import '../lib/tenant/install';
import { database } from '../config/database';
import { purgeDepartments } from '../modules/hr/department.purge';
import { logger } from '../utils/logger';
import '../graphql';

/**
 * Deletes one organization's departments and positions. Counts only, unless --confirm.
 *
 *   node dist/scripts/purge-departments.js --organization exyconn
 *   node dist/scripts/purge-departments.js --organization exyconn --confirm
 */
async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const slug = args[args.indexOf('--organization') + 1];
  if (!args.includes('--organization') || !slug) {
    throw new Error('Pass --organization <handle>, e.g. --organization exyconn');
  }
  await database.connect();
  const result = await purgeDepartments(slug, args.includes('--confirm'));
  const verb = result.deleted ? 'Deleted' : 'Would delete (run again with --confirm)';
  logger.info(
    `${verb}: ${result.departments} departments and ${result.positions} positions of ${result.organization}`,
  );
  await database.disconnect();
}

run().catch((error: unknown) => {
  logger.error(error, 'Purging departments failed');
  process.exit(1);
});

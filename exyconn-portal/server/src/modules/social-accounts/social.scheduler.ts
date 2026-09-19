import { forEachOrganization } from '../organizations';
import { logger } from '../../utils/logger';
import { publishDuePosts } from './social.publish';
import { syncAllAccounts } from './social.sync';

/** Scheduled posts go out within a minute of their time. */
const PUBLISH_TICK_MS = 60 * 1000;
/** Posts and their numbers are read again every six hours; "Sync now" is there in between. */
const SYNC_TICK_MS = 6 * 60 * 60 * 1000;

/** Starts publishing scheduled posts, and refreshing every account's posts and numbers. */
export function startSocialSchedule(): void {
  const publish = () => {
    forEachOrganization(publishDuePosts, 'Scheduled social posts').catch((error: unknown) =>
      logger.error(error, 'Scheduled social post check failed'),
    );
  };
  const sync = () => {
    forEachOrganization(syncAllAccounts, 'Social account sync').catch((error: unknown) =>
      logger.error(error, 'Social account sync failed'),
    );
  };
  publish();
  globalThis.setInterval(publish, PUBLISH_TICK_MS).unref();
  globalThis.setInterval(sync, SYNC_TICK_MS).unref();
  logger.info('Social schedule started');
}

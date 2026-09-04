import { imageUploader } from '../../utils/imagekit';
import { logger } from '../../utils/logger';
import { TrackerScreenshotModel } from './models';
import { getTrackerSettings } from './tracker.settings.service';

/** How often the process asks whether any screenshots have aged out. */
const TICK_MS = 60 * 60 * 1000;

/**
 * How many expired screenshots one pass removes.
 *
 * A workspace switching retention on for the first time can have years of history behind
 * it, and deleting all of it in one pass would hold a connection open against ImageKit for
 * as long as that takes. The purge takes a bite each hour instead and catches up over a few
 * passes — retention is a policy about days, so it does not need to complete in one minute.
 */
const BATCH = 500;

/** What one purge pass did, so the caller can log it and a test can assert on it. */
export interface PurgeResult {
  deleted: number;
  /** Rows removed whose image could not be: captured before `fileId` was recorded. */
  orphaned: number;
  failed: number;
}

/** The instant a screenshot must predate to have expired under a `days`-day policy. */
export function expiryCutoff(days: number, now: Date): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Deletes one batch of screenshots older than the retention window, image first.
 *
 * The image is deleted BEFORE the row, and the row survives a failed image delete: losing
 * the row while the image lives on would leave a screenshot of an employee on the CDN that
 * nothing in the portal knows about or can ever remove. A retry on the next pass is the
 * cheap outcome; an untracked image is not.
 */
export async function purgeExpiredScreenshots(cutoff: Date): Promise<PurgeResult> {
  const expired = await TrackerScreenshotModel.find({ capturedAt: { $lt: cutoff } })
    .select('_id fileId')
    .limit(BATCH)
    .lean();

  const result: PurgeResult = { deleted: 0, orphaned: 0, failed: 0 };
  const removable: unknown[] = [];

  for (const shot of expired) {
    if (!shot.fileId) {
      // Captured before the file id was recorded: the row can go, the image cannot.
      removable.push(shot._id);
      result.orphaned += 1;
      continue;
    }
    try {
      await imageUploader.deleteFile(shot.fileId);
      removable.push(shot._id);
      result.deleted += 1;
    } catch (error) {
      logger.error({ error, fileId: shot.fileId }, 'Screenshot image delete failed');
      result.failed += 1;
    }
  }

  if (removable.length > 0) {
    await TrackerScreenshotModel.deleteMany({ _id: { $in: removable } });
  }
  return result;
}

/** Runs a pass if the workspace has a retention window set. Zero days means keep forever. */
async function runIfConfigured(): Promise<void> {
  const settings = await getTrackerSettings();
  const days = settings.screenshotRetentionDays ?? 0;
  if (days <= 0) {
    return;
  }

  const result = await purgeExpiredScreenshots(expiryCutoff(days, new Date()));
  if (result.deleted + result.orphaned + result.failed === 0) {
    return;
  }
  logger.info({ ...result, retentionDays: days }, 'Tracker screenshot retention pass complete');
}

/** Starts the hourly check that deletes screenshots past the workspace's retention window. */
export function startTrackerRetention(): void {
  const tick = () => {
    runIfConfigured().catch((error: unknown) =>
      logger.error(error, 'Tracker screenshot retention pass failed'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Tracker screenshot retention started');
}

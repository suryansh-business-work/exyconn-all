import { githubActions, type TrackerRelease } from '../../utils/github';
import { logger } from '../../utils/logger';
import { badRequest } from '../../utils/errors';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { runAsPlatform } from '../../lib/tenant';
import { beyondRetention } from '../../utils/retention';
import { registerBackgroundJob } from './jobs.registry';
import { TrackerBuildSettingsModel } from './tracker-build-settings.model';

/** The settings row is a singleton, so it is always read and written under this key. */
const SETTINGS_KEY = 'default';

/** The retention loop looks once an hour; a build published in between waits at most that long. */
const TICK_MS = 60 * 60 * 1000;

/** The most builds the retention setting can keep — far beyond any real need, a guard on input. */
export const MAX_KEEP_LATEST_BUILDS = 500;

/** Mirrors the GraphQL `TrackerVersionBump` enum. */
export type TrackerVersionBump = 'NONE' | 'PATCH' | 'MINOR' | 'MAJOR';

/**
 * The releases the retention setting lets go: everything past the newest `keep`, except the
 * newest release of each platform. A build can be run for a subset of platforms, and the update
 * feed and Download page read each platform off the newest release carrying it — deleting that
 * one would leave a platform with nothing to install or update to.
 */
export function releasesBeyondRetention(
  releases: readonly TrackerRelease[],
  keep: number,
): TrackerRelease[] {
  return beyondRetention(releases, keep, (release) =>
    release.assets.map((asset) => asset.platform),
  );
}

/** Published tracker builds: listing, deleting, and keeping only the newest. */
export const trackerReleasesService = {
  /** Every published tracker build, newest first. */
  list(): Promise<TrackerRelease[]> {
    return githubActions.listAllTrackerReleases();
  },

  /** Deletes one build — its release and its tag. */
  delete(id: string): Promise<TrackerRelease> {
    return githubActions.deleteTrackerRelease(id);
  },

  /** Saves how many of the newest builds the retention loop keeps (0 keeps them all). */
  async saveRetention(keepLatestBuilds: number) {
    if (!Number.isInteger(keepLatestBuilds) || keepLatestBuilds < 0) {
      badRequest('Builds to keep must be a whole number, 0 or more.');
    }
    if (keepLatestBuilds > MAX_KEEP_LATEST_BUILDS) {
      badRequest(`Builds to keep can be at most ${MAX_KEEP_LATEST_BUILDS}.`);
    }
    return TrackerBuildSettingsModel.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { keepLatestBuilds },
      { new: true, upsert: true },
    ).lean();
  },

  /**
   * One retention pass: deletes the builds past the newest N. Off (0) until somebody sets it.
   * Idempotent — a second pass straight after finds nothing to delete. Answers how many went.
   */
  async applyRetention(): Promise<number> {
    const settings = await TrackerBuildSettingsModel.findOne({ key: SETTINGS_KEY }).lean();
    const keep = settings?.keepLatestBuilds ?? 0;
    if (keep <= 0) {
      return 0;
    }
    const doomed = releasesBeyondRetention(await githubActions.listAllTrackerReleases(), keep);
    let deleted = 0;
    for (const release of doomed) {
      try {
        await githubActions.deleteTrackerRelease(release.id);
        deleted++;
      } catch (error) {
        logger.error({ err: error, tag: release.tag }, 'Could not delete an old tracker build');
      }
    }
    recordJobRun(
      JOB_KEYS.trackerBuildRetention,
      `Kept the newest ${keep}, deleted ${deleted} of ${doomed.length}`,
    );
    return deleted;
  },
};

/** Starts the hourly pass that deletes tracker builds past the newest N. */
export function startTrackerBuildRetention(): void {
  const tick = () => {
    // The builds are the platform's own (one repository for every company), not any company's.
    runAsPlatform(() => trackerReleasesService.applyRetention()).catch((error: unknown) =>
      logger.error(error, 'Tracker build retention pass failed'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Tracker build retention started');
}

registerBackgroundJob({
  key: JOB_KEYS.trackerBuildRetention,
  label: 'Tracker build retention',
  description: 'Deletes tracker builds older than the newest N set in Tracker > Builds.',
  runOnce: () => trackerReleasesService.applyRetention(),
});

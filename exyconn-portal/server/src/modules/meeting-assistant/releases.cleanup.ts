import { Types } from 'mongoose';
import { runAsPlatform } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';
import { beyondRetention } from '../../utils/retention';
import { registerBackgroundJob } from '../tech/jobs.registry';
import { MaReleaseModel, MaReleaseSettingsModel, type MaReleaseSettingsDocument } from './models';
import { isDownloadable, type LeanRelease } from './releases.service';
import { deleteReleaseZip } from './releases.store';

/** The retention pass looks once an hour. */
const TICK_MS = 60 * 60 * 1000;

/** The most builds retention can keep — far beyond any real need, a guard on input. */
export const MAX_KEEP_LATEST_BUILDS = 500;

const KEY = 'global';

/** Deletes one extension build: its row, then its ZIP. Answers what was deleted. */
export async function deleteRelease(id: string): Promise<LeanRelease> {
  if (!Types.ObjectId.isValid(id)) {
    notFound('Release');
  }
  const release = await runAsPlatform(() =>
    MaReleaseModel.findByIdAndDelete(id).lean<LeanRelease>(),
  );
  if (!release) {
    notFound('Release');
  }
  await deleteReleaseZip(release.fileId);
  return release;
}

/**
 * Builds the retention setting lets go: past the newest N, except the newest build people can
 * download on each channel — deleting that one would leave a channel with nothing to install.
 */
export function releasesBeyondRetention(
  releases: readonly LeanRelease[],
  keep: number,
): LeanRelease[] {
  return beyondRetention(releases, keep, (release) =>
    isDownloadable(release) ? [release.channel] : [],
  );
}

/** Saves how many of the newest builds to keep (0 keeps them all). */
export function saveReleaseRetention(
  keepLatestBuilds: number,
  byName: string,
): Promise<MaReleaseSettingsDocument> {
  if (!Number.isInteger(keepLatestBuilds) || keepLatestBuilds < 0) {
    badRequest('Builds to keep must be a whole number, 0 or more.');
  }
  if (keepLatestBuilds > MAX_KEEP_LATEST_BUILDS) {
    badRequest(`Builds to keep can be at most ${MAX_KEEP_LATEST_BUILDS}.`);
  }
  return runAsPlatform(() =>
    MaReleaseSettingsModel.findOneAndUpdate(
      { key: KEY },
      { keepLatestBuilds, updatedByName: byName },
      { new: true, upsert: true },
    ).lean<MaReleaseSettingsDocument>(),
  ) as Promise<MaReleaseSettingsDocument>;
}

/**
 * One retention pass: deletes the builds past the newest N. Off (0) until a release manager
 * sets it; idempotent, so a second pass straight after deletes nothing. Answers how many went.
 */
export async function applyReleaseRetention(): Promise<number> {
  const settings = await runAsPlatform(() => MaReleaseSettingsModel.findOne({ key: KEY }).lean());
  const keep = settings?.keepLatestBuilds ?? 0;
  if (keep <= 0) {
    return 0;
  }
  const releases = await runAsPlatform(() =>
    MaReleaseModel.find().sort({ builtAt: -1 }).lean<LeanRelease[]>(),
  );
  const doomed = releasesBeyondRetention(releases, keep);
  let deleted = 0;
  for (const release of doomed) {
    try {
      await deleteRelease(String(release._id));
      deleted++;
    } catch (error) {
      logger.error(
        { err: error, version: release.version },
        'Could not delete an old extension build',
      );
    }
  }
  recordJobRun(
    JOB_KEYS.meetingAssistantReleaseRetention,
    `Kept the newest ${keep}, deleted ${deleted} of ${doomed.length}`,
  );
  return deleted;
}

/** Starts the hourly pass that deletes extension builds past the newest N. */
export function startReleaseRetention(): void {
  const tick = () => {
    applyReleaseRetention().catch((error: unknown) =>
      logger.error(error, 'Extension build retention pass failed'),
    );
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('Extension build retention started');
}

registerBackgroundJob({
  key: JOB_KEYS.meetingAssistantReleaseRetention,
  label: 'Extension build retention',
  description: 'Deletes Meeting Assistant extension builds older than the newest N kept.',
  runOnce: () => applyReleaseRetention(),
});

import { TrackerSettingsModel, type TrackerSettingsDocument } from './models';
import { TRACKER_DEFAULTS } from './tracker.constants';

export interface TrackerSettingsInput {
  intervalMinutes?: number;
  screenshotsPerInterval?: number;
  randomizeScreenshotTiming?: boolean;
  blurScreenshots?: boolean;
  trackWindowTitles?: boolean;
  idleThresholdSeconds?: number;
  screenshotMaxWidth?: number;
  screenshotQuality?: number;
  autoSyncEnabled?: boolean;
  syncIntervalMinutes?: number;
  /** Rich text (HTML) disclosure shown in the desktop app before tracking starts. */
  consentText?: string;
}

/** A plain serialized tracker-settings object (as `withId` and resolvers consume it). */
export type TrackerSettingsLean = TrackerSettingsDocument & { _id: unknown };

/**
 * Fills in any setting the stored document predates.
 *
 * Mongoose only applies schema defaults when a document is CREATED, and `.lean()` reads
 * skip them entirely — so a settings doc written before a field existed comes back without
 * it, and the non-nullable GraphQL field then blows up with "Cannot return null". Merging
 * the defaults underneath the stored values keeps reads whole no matter when the row was
 * written. Stored values (including `false` and `0`) always win, since absent keys are the
 * only thing the spread fills.
 */
function withDefaults(doc: TrackerSettingsLean): TrackerSettingsLean {
  return { ...TRACKER_DEFAULTS, ...doc };
}

/** Reads the single global tracker settings document, creating defaults on first use. */
export async function getTrackerSettings(): Promise<TrackerSettingsLean> {
  const existing = await TrackerSettingsModel.findOne({ key: 'global' }).lean();
  if (existing) {
    return withDefaults(existing as TrackerSettingsLean);
  }
  const created = await TrackerSettingsModel.create({ key: 'global' });
  return created.toObject() as TrackerSettingsLean;
}

/** Updates the global tracker settings (portal, TRACKER role). */
export async function updateTrackerSettings(
  input: TrackerSettingsInput,
): Promise<TrackerSettingsLean> {
  const updated = await TrackerSettingsModel.findOneAndUpdate({ key: 'global' }, input, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();
  return withDefaults(updated as TrackerSettingsLean);
}

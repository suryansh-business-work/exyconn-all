import { TrackerSettingsModel, type TrackerSettingsDocument } from './models';

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
}

/** A plain serialized tracker-settings object (as `withId` and resolvers consume it). */
export type TrackerSettingsLean = TrackerSettingsDocument & { _id: unknown };

/** Reads the single global tracker settings document, creating defaults on first use. */
export async function getTrackerSettings(): Promise<TrackerSettingsLean> {
  const existing = await TrackerSettingsModel.findOne({ key: 'global' }).lean();
  if (existing) {
    return existing as TrackerSettingsLean;
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
  }).lean();
  return updated as TrackerSettingsLean;
}

import { TrackerSettingsModel, type TrackerSettingsDocument } from './models';
import { TRACKER_DEFAULTS, WEBCAM_CORNERS } from './tracker.constants';

const CORNERS = new Set<string>(WEBCAM_CORNERS);
import { isValidTimezone } from './tracker.timezone';
import { badRequest } from '../../utils/errors';

export interface TrackerSettingsInput {
  intervalMinutes?: number;
  screenshotsPerInterval?: number;
  randomizeScreenshotTiming?: boolean;
  blurScreenshots?: boolean;
  trackWindowTitles?: boolean;
  idleThresholdSeconds?: number;
  screenshotMaxWidth?: number;
  /** 0-100; 100 is lossless at native resolution. */
  screenshotQuality?: number;
  webcamEnabled?: boolean;
  /** One of WEBCAM_CORNERS. */
  webcamCorner?: string;
  syncIntervalMinutes?: number;
  /** Rich text (HTML) disclosure shown in the desktop app before tracking starts. */
  consentText?: string;
  /** House default IANA zone; '' means "use each employee's own device zone". */
  defaultTimezone?: string;
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
  // '' is a meaningful value here ("no house default"), anything else must be a zone the
  // platform can resolve — a typo would silently misdate every employee's hours.
  if (input.defaultTimezone && !isValidTimezone(input.defaultTimezone)) {
    badRequest(`Unknown timezone: ${input.defaultTimezone}`);
  }

  // The corner is a free-form String in the schema (GraphQL enums would rename the values);
  // reject anything the desktop app cannot actually place a photo in.
  if (input.webcamCorner && !CORNERS.has(input.webcamCorner)) {
    badRequest(`Unknown webcam corner: ${input.webcamCorner}`);
  }

  const updated = await TrackerSettingsModel.findOneAndUpdate({ key: 'global' }, input, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).lean();
  return withDefaults(updated as TrackerSettingsLean);
}

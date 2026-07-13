import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { TRACKER_DEFAULTS } from '../tracker.constants';

/**
 * Global tracker configuration, edited from the portal and pulled by the desktop app on
 * every start. Single document, keyed `global` (same pattern as AppSettings), so nothing
 * about capture cadence or privacy is hardcoded in the client.
 */
const trackerSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    intervalMinutes: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.intervalMinutes,
      min: 1,
      max: 60,
    },
    screenshotsPerInterval: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.screenshotsPerInterval,
      min: 0,
      max: 10,
    },
    randomizeScreenshotTiming: {
      type: Boolean,
      required: true,
      default: TRACKER_DEFAULTS.randomizeScreenshotTiming,
    },
    blurScreenshots: {
      type: Boolean,
      required: true,
      default: TRACKER_DEFAULTS.blurScreenshots,
    },
    trackWindowTitles: {
      type: Boolean,
      required: true,
      default: TRACKER_DEFAULTS.trackWindowTitles,
    },
    idleThresholdSeconds: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.idleThresholdSeconds,
      min: 60,
      max: 3600,
    },
    screenshotMaxWidth: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.screenshotMaxWidth,
      min: 640,
      max: 3840,
    },
    screenshotQuality: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.screenshotQuality,
      min: 20,
      max: 100,
    },
    /**
     * The disclosure the employee must accept in the desktop app before tracking can start.
     * Rich text (HTML) authored in the portal, rendered by the app's consent screen.
     */
    consentText: {
      type: String,
      required: true,
      default: TRACKER_DEFAULTS.consentText,
    },
    autoSyncEnabled: {
      type: Boolean,
      required: true,
      default: TRACKER_DEFAULTS.autoSyncEnabled,
    },
    syncIntervalMinutes: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.syncIntervalMinutes,
      min: 1,
      max: 60,
    },
  },
  { timestamps: true },
);

export type TrackerSettingsDocument = InferSchemaType<typeof trackerSettingsSchema>;
export const TrackerSettingsModel: Model<TrackerSettingsDocument> = model<TrackerSettingsDocument>(
  'TrackerSettings',
  trackerSettingsSchema,
);

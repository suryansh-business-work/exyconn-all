import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { TRACKER_DEFAULTS, WEBCAM_CORNERS } from '../tracker.constants';

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
    /** 0-100. 100 is lossless at native resolution; see TRACKER_DEFAULTS for the contract. */
    screenshotQuality: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.screenshotQuality,
      min: 0,
      max: 100,
    },
    webcamEnabled: {
      type: Boolean,
      required: true,
      default: TRACKER_DEFAULTS.webcamEnabled,
    },
    webcamCorner: {
      type: String,
      required: true,
      enum: WEBCAM_CORNERS,
      default: TRACKER_DEFAULTS.webcamCorner,
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
    /**
     * Slug of the Legal policy used as the tracking disclosure. Not `required` — '' is the
     * meaningful value "no policy chosen; fall back to consentText", and Mongoose's
     * `required` validator rejects an empty string.
     */
    consentPolicySlug: {
      type: String,
      default: TRACKER_DEFAULTS.consentPolicySlug,
      trim: true,
      lowercase: true,
    },
    syncIntervalMinutes: {
      type: Number,
      required: true,
      default: TRACKER_DEFAULTS.syncIntervalMinutes,
      min: 1,
      max: 60,
    },
    /**
     * House default IANA zone. Not `required` — an empty string is the meaningful value
     * "use the employee's own device zone", and Mongoose's `required` validator rejects ''.
     */
    defaultTimezone: {
      type: String,
      default: TRACKER_DEFAULTS.defaultTimezone,
      trim: true,
    },
  },
  { timestamps: true },
);

export type TrackerSettingsDocument = InferSchemaType<typeof trackerSettingsSchema>;
export const TrackerSettingsModel: Model<TrackerSettingsDocument> = model<TrackerSettingsDocument>(
  'TrackerSettings',
  trackerSettingsSchema,
);

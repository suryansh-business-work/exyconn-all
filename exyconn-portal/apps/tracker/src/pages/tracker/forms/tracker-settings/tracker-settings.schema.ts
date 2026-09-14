import { z } from 'zod';
import { isValidTimezone } from '../../tracker.timezone';
import { WEBCAM_CORNERS } from './webcam.options';
import type { TrackerSettingsRow } from './tracker-settings.types';

/** The capture rules every tracker in the workspace obeys. */
export const trackerSettingsSchema = z.object({
  intervalMinutes: z.coerce.number({ message: 'Enter a number' }).int().min(1).max(60),
  screenshotsPerInterval: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(10),
  idleThresholdSeconds: z.coerce.number({ message: 'Enter a number' }).int().min(10).max(3600),
  // 0 switches auto-pause off — the only value that leaves a session running while idle.
  idleAutoPauseMinutes: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(240),
  screenshotMaxWidth: z.coerce.number({ message: 'Enter a number' }).int().min(320).max(3840),
  // 0-100. 100 is the honest top of the scale: native resolution, encoded losslessly.
  screenshotQuality: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(100),
  // 0 means "keep indefinitely" — the only value that deletes nothing.
  screenshotRetentionDays: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(3650),
  syncIntervalMinutes: z.coerce.number({ message: 'Enter a number' }).int().min(1).max(60),
  randomizeScreenshotTiming: z.boolean(),
  blurScreenshots: z.boolean(),
  trackWindowTitles: z.boolean(),
  captureSoundEnabled: z.boolean(),
  webcamEnabled: z.boolean(),
  webcamCorner: z.enum(WEBCAM_CORNERS as [string, ...string[]]),
  autoStartEnabled: z.boolean(),
  autoStartHour: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(23),
  autoStopHour: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(23),
  dailyDigestEnabled: z.boolean(),
  weeklyDigestEnabled: z.boolean(),
  digestHour: z.coerce.number({ message: 'Enter a number' }).int().min(0).max(23),
  consentText: z.string().min(1, 'Consent text is required'),
  consentPolicySlug: z.string(),
  defaultTimezone: z
    .string()
    .refine((value) => value === '' || isValidTimezone(value), 'Choose a valid IANA timezone'),
});

export type TrackerSettingsValues = z.infer<typeof trackerSettingsSchema>;

/** The saved row, as the form's fields. */
export const toInitial = (row: TrackerSettingsRow): TrackerSettingsValues => ({
  intervalMinutes: row.intervalMinutes,
  screenshotsPerInterval: row.screenshotsPerInterval,
  idleThresholdSeconds: row.idleThresholdSeconds,
  idleAutoPauseMinutes: row.idleAutoPauseMinutes,
  screenshotMaxWidth: row.screenshotMaxWidth,
  screenshotQuality: row.screenshotQuality,
  screenshotRetentionDays: row.screenshotRetentionDays,
  syncIntervalMinutes: row.syncIntervalMinutes,
  randomizeScreenshotTiming: row.randomizeScreenshotTiming,
  blurScreenshots: row.blurScreenshots,
  trackWindowTitles: row.trackWindowTitles,
  captureSoundEnabled: row.captureSoundEnabled,
  webcamEnabled: row.webcamEnabled,
  webcamCorner: row.webcamCorner,
  autoStartEnabled: row.autoStartEnabled,
  autoStartHour: row.autoStartHour,
  autoStopHour: row.autoStopHour,
  dailyDigestEnabled: row.dailyDigestEnabled,
  weeklyDigestEnabled: row.weeklyDigestEnabled,
  digestHour: row.digestHour,
  consentText: row.consentText,
  consentPolicySlug: row.consentPolicySlug,
  defaultTimezone: row.defaultTimezone,
});

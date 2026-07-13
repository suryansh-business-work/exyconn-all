/**
 * Shared constants for the desktop time tracker.
 *
 * PRIVACY CONTRACT — read before extending this module.
 * The tracker records keystroke and mouse-click *counts* only. It never records which
 * keys were pressed, and no field in this module is permitted to carry key content.
 * Counting activity is what makes an activity percentage possible; capturing content
 * would make this a keylogger. Do not add such a field.
 */

/** Platforms the desktop app runs on. */
export const DEVICE_PLATFORMS = ['win32', 'darwin'] as const;

/** Lifecycle of a tracking session. */
export const SESSION_STATUSES = ['active', 'stopped'] as const;

/** Default tracker settings, overridable from the portal (Tracker > Settings). */
export const TRACKER_DEFAULTS = Object.freeze({
  /** Length of one activity bucket, in minutes. */
  intervalMinutes: 10,
  /** Screenshots captured per interval. */
  screenshotsPerInterval: 1,
  /** Capture at a random moment inside the interval rather than on a predictable clock. */
  randomizeScreenshotTiming: true,
  /** Blur screenshots before upload, so context is visible but on-screen content is not. */
  blurScreenshots: false,
  /** Record the foreground window's title (not just the app name). */
  trackWindowTitles: true,
  /** No input for this long marks the time as idle. */
  idleThresholdSeconds: 300,
  /** Screenshots are downscaled to this width and JPEG-encoded before upload. */
  screenshotMaxWidth: 1280,
  screenshotQuality: 60,
  /**
   * Push queued activity + screenshots to the portal automatically. When off, nothing
   * leaves the machine until the employee presses "Sync now" in the app — the data is
   * still captured and queued durably on disk either way.
   */
  autoSyncEnabled: true,
  /** How often the desktop app flushes its outbox to the portal, in minutes. */
  syncIntervalMinutes: 5,
});

/** Upper bounds enforced server-side so a compromised client cannot flood the DB. */
export const TRACKER_LIMITS = Object.freeze({
  maxIntervalsPerSync: 200,
  maxWindowUsagePerInterval: 100,
  /** Matches the /graphql body limit; a screenshot arrives base64-encoded. */
  maxScreenshotBytes: 8 * 1024 * 1024,
});

export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];

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

/** Where the webcam photo is composited onto the screenshot, when webcam capture is on. */
export const WEBCAM_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

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
  /** Screenshots are downscaled to this width before upload. Ignored at quality 100. */
  screenshotMaxWidth: 1280,
  /**
   * Screenshot quality, 0-100.
   *
   * 100 means ACTUAL best quality: the screen is captured at its native resolution and
   * encoded losslessly (PNG), with no downscale — what the employee saw, pixel for pixel.
   * Anything below 100 is a JPEG at that quality, downscaled to screenshotMaxWidth. Higher
   * quality costs upload bandwidth and storage, which is the whole reason it is a dial.
   */
  screenshotQuality: 100,
  /**
   * Capture a webcam photo alongside each screenshot and composite it into a corner of the
   * shot. Off by default, and deliberately so: photographing an employee is a far bigger
   * intrusion than photographing their screen. Turning it on changes what the consent screen
   * discloses, and macOS will ask the employee for camera access on top of that.
   */
  webcamEnabled: false,
  /** Which corner of the screenshot the webcam photo is placed in. */
  webcamCorner: 'bottom-right',
  /**
   * How often the desktop app flushes its outbox to the portal, in minutes.
   *
   * Syncing is automatic and always on. It used to be switchable, with a "Sync now" button
   * as the manual path — which meant an employee could work all week with an unswitched
   * toggle and nothing uploaded, and nobody found out until the timesheet was empty. One
   * path, on a cadence an admin sets.
   */
  syncIntervalMinutes: 5,
  /**
   * IANA zone (e.g. "Asia/Kolkata") every employee's tracker times are read in unless they
   * pick their own. Empty string means "no house default" — fall back to whatever zone the
   * employee's own machine reports. See tracker.timezone.ts for the resolution order.
   */
  defaultTimezone: '',

  /**
   * The disclosure shown in the desktop app before tracking can start. Rich text (HTML),
   * editable in the portal. It must stay an honest description of what is recorded —
   * monitoring is only legitimate when the person being monitored knows about it.
   */
  consentText: [
    '<p>While tracking is <strong>on</strong>, the Exyconn Tracker records:</p>',
    '<ul>',
    '<li>Time worked, and whether you are active or idle</li>',
    '<li>The <strong>number</strong> of key presses and mouse clicks — never which keys you press, and never what you type</li>',
    '<li>Which application and window is in the foreground, and for how long</li>',
    '<li>Periodic screenshots of your screen</li>',
    '<li><em>If your workspace has enabled it:</em> a photo from your webcam, taken at the same moment as the screenshot and shown in a corner of it. The app tells you every time, and macOS will ask for camera access first.</li>',
    '</ul>',
    '<p>Nothing is recorded while tracking is off. You can pause or stop at any time, and you can review everything recorded about you — including your own screenshots — from <strong>My Tracker</strong> in the portal.</p>',
  ].join(''),
});

/** Upper bounds enforced server-side so a compromised client cannot flood the DB. */
export const TRACKER_LIMITS = Object.freeze({
  maxIntervalsPerSync: 200,
  maxWindowUsagePerInterval: 100,
  /**
   * Largest screenshot the portal accepts, in DECODED bytes.
   *
   * This used to be compared against the base64 string's length, which counts characters,
   * not bytes — base64 is 4 characters per 3 bytes, so the real ceiling was 6MB, not 8. A
   * lossless native-resolution capture sails past that, the upload came back BAD_USER_INPUT,
   * and the outbox drops a permanent rejection: quality 100 did not produce worse
   * screenshots, it produced no screenshots. Sized for a lossless retina capture now.
   */
  maxScreenshotBytes: 24 * 1024 * 1024,
});

export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];
export type WebcamCorner = (typeof WEBCAM_CORNERS)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];

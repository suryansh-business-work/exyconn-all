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

/**
 * Lifecycle of an off-computer time entry. Claimed time counts for nothing until a reviewer
 * approves it, so PENDING is where every entry starts and APPROVED is the only state any
 * report adds up.
 */
export const MANUAL_ENTRY_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

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
   * How many days a screenshot is kept before it is deleted, image and row together.
   *
   * ZERO MEANS KEEP INDEFINITELY, and that is the default on purpose: shipping a retention
   * window as the default would silently destroy screenshots an existing workspace is
   * holding for a reason, on the deploy that introduced the feature. An admin opts in, and
   * once they do the purge is irreversible — which is the point of a retention policy.
   */
  screenshotRetentionDays: 0,
  /**
   * Start and stop tracking on a schedule instead of waiting for the employee to press start.
   *
   * Off by default. A workspace turning this on is changing what the app does without being
   * asked to, so it is a decision an admin makes deliberately — and the consent screen still
   * gates the first session either way.
   */
  autoStartEnabled: false,
  /** Local hour (0-23) tracking starts at, read in the EMPLOYEE's own timezone. */
  autoStartHour: 9,
  /**
   * Local hour (0-23) tracking stops at. A stop hour at or before the start hour means the
   * window runs past midnight — a night shift is a working day like any other.
   */
  autoStopHour: 18,
  /**
   * Email a summary of yesterday's tracked time to everyone holding the TRACKER role.
   *
   * Off by default: a workspace that has just switched the tracker on should not start
   * mailing its managers because of a deploy.
   */
  dailyDigestEnabled: false,
  /** The same summary for the last seven days, sent on a Monday. */
  weeklyDigestEnabled: false,
  /** Local hour (0-23) the digests are sent at, read in the workspace's own timezone. */
  digestHour: 9,
  /**
   * IANA zone (e.g. "Asia/Kolkata") every employee's tracker times are read in unless they
   * pick their own. Empty string means "no house default" — fall back to whatever zone the
   * employee's own machine reports. See tracker.timezone.ts for the resolution order.
   */
  defaultTimezone: '',
  /**
   * Slug of the Legal policy the desktop app shows as its tracking disclosure. Empty means
   * "no policy chosen" — the app falls back to `consentText` below. Pointing this at a
   * published policy is what makes one acceptance count in Legal, HR and the tracker at
   * once, and what makes changed wording ask everybody again.
   */
  consentPolicySlug: '',

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

/**
 * The house-wide project every employee can book time against, created on demand.
 *
 * Tracking has to be able to start before anybody has set a project up, and time booked
 * against nothing is time nobody can report on — so there is always this one.
 */
export const GLOBAL_PROJECT = Object.freeze({
  name: 'Global Project',
  key: 'GLBL',
  description: 'Default project for time that does not belong to a specific project.',
});

/** Rules for reading an employee's working day. */
export const TRACKER_WORKDAY = Object.freeze({
  /**
   * How far back the day-total aggregation looks. Two days covers every zone offset from
   * UTC in both directions, so the employee's local "today" is always inside the window.
   */
  lookbackMs: 48 * 60 * 60 * 1000,
  /** Project states time may be booked against. A finished project is not one of them. */
  bookableProjectStatuses: ['PLANNING', 'ACTIVE', 'ON_HOLD'],
});

/** Bounds on one off-computer claim, so a typo cannot book a month to a single day. */
export const TRACKER_MANUAL_LIMITS = Object.freeze({
  /** Longest single entry. A day of off-computer work is a day; more is a data-entry slip. */
  maxDurationMs: 16 * 60 * 60 * 1000,
  /** Shortest entry worth a review. */
  minDurationMs: 60 * 1000,
  /** How far back an entry may be claimed, so last quarter cannot be re-opened. */
  maxBackdateMs: 90 * 24 * 60 * 60 * 1000,
});

export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];
export type ManualEntryStatus = (typeof MANUAL_ENTRY_STATUSES)[number];
export type WebcamCorner = (typeof WEBCAM_CORNERS)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];

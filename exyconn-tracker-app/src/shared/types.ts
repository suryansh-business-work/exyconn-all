/** Shapes shared across the Electron main process, preload bridge and renderer. */

export type TrackerStatus = 'signed-out' | 'consent-required' | 'idle' | 'tracking' | 'paused';

/** Where the webcam photo is composited onto the screenshot. Mirrors the portal's list. */
export type WebcamCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface TrackerSettings {
  intervalMinutes: number;
  screenshotsPerInterval: number;
  randomizeScreenshotTiming: boolean;
  blurScreenshots: boolean;
  trackWindowTitles: boolean;
  idleThresholdSeconds: number;
  /** Screenshots are downscaled to this width. Ignored at quality 100. */
  screenshotMaxWidth: number;
  /**
   * 0-100. 100 means ACTUAL best quality — native resolution, encoded losslessly (PNG), no
   * downscale. Below 100 is a JPEG at that quality, downscaled to `screenshotMaxWidth`.
   */
  screenshotQuality: number;
  /** Take a webcam photo with each screenshot and composite it into a corner of the shot. */
  webcamEnabled: boolean;
  /** Which corner that photo goes in. */
  webcamCorner: WebcamCorner;
  /** Start and stop tracking on the workspace's schedule instead of waiting for a press. */
  autoStartEnabled: boolean;
  /** Local hours, 0-23. A stop at or before the start means the window crosses midnight. */
  autoStartHour: number;
  autoStopHour: number;
  /**
   * How often the outbox is flushed to the portal, in minutes. Syncing is automatic and
   * always on — there is no manual path, and so no switch to leave off by accident.
   */
  syncIntervalMinutes: number;
  /** Rich text (HTML) disclosure, authored in the portal and rendered on the consent screen. */
  consentText: string;
}

/** When an employee is contracted to work. Mirrors the portal's WorkingTime enum. */
export type WorkingTime = 'FLEXIBLE' | 'FIXED' | 'OTHER';

/** Where an employee is contracted to work from. Mirrors the portal's WorkLocation enum. */
export type WorkLocation = 'OFFICE' | 'HOME' | 'HYBRID' | 'OTHER';

/** How an employee can mark themselves in for a day. Mirrors the portal's AttendanceStatus. */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'WFH' | 'HALF_DAY';

/**
 * What this employee is contracted to work, set by HR on their employee record.
 *
 * The app never invents these — an arrangement the tracker made up is one HR has not agreed
 * to. `targetMs` is the day the progress bar fills against.
 */
export interface WorkProfile {
  workingTime: WorkingTime;
  /** What "Other" means for this person; empty for the named arrangements. */
  workingTimeNote: string;
  workLocation: WorkLocation;
  workLocationNote: string;
  workHoursPerDay: number;
  /** The contracted day in milliseconds — the same unit as every tracked total. */
  targetMs: number;
}

/** The employee's current local day: the target, the progress, and the attendance gate. */
export interface Workday {
  /** The employee's local calendar date, YYYY-MM-DD. */
  date: string;
  targetMs: number;
  /** Active ms the PORTAL has recorded for today. The live session is added on top locally. */
  activeMs: number;
  attendanceStatus: AttendanceStatus | null;
  attendanceNote: string | null;
  /** Tracking cannot start until this is true. */
  attendanceMarked: boolean;
}

/** One project the employee may book time against. */
export interface TrackerProject {
  id: string;
  name: string;
  key: string;
}

/** One ticket on that project. `assignedToMe` is why the picker can lead with the right ones. */
export interface TrackerTask {
  id: string;
  /** The human handle, e.g. EXY-14. */
  key: string;
  title: string;
  assignedToMe: boolean;
}

/**
 * The Legal policy the workspace uses as its tracking disclosure, and whether THIS employee
 * has signed the version now published. Null when the workspace has not chosen one.
 */
export interface ConsentPolicy {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  version: number;
  requiresAcknowledgement: boolean;
  acknowledged: boolean;
}

/** Brand identity pulled from the portal (publicBranding) — drives logo, name and colours. */
export interface Branding {
  businessName: string;
  legalName: string;
  slogan: string;
  logoUrl: string;
  logoDarkUrl: string;
  appIconUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  supportEmail: string;
  websiteUrl: string;
  /** The whole notice, authored in the admin panel. Empty means "compose one from the name". */
  copyrightText: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

/** Which OS permissions the tracker still needs (macOS TCC). Always false on Windows. */
export interface PermissionState {
  screenRecording: boolean;
  accessibility: boolean;
  /**
   * Camera access. Only ever required when the workspace has turned webcam capture on, so it
   * is reported as granted when it is not needed — nobody is asked for a camera they will
   * never be photographed with.
   */
  camera: boolean;
  /** True when the platform needs no explicit grants (Windows). */
  allGranted: boolean;
}

/** A permission the app can ask the OS for. */
export type PermissionKind = 'screenRecording' | 'accessibility' | 'camera';

/** How the app picks its palette. `system` follows the OS. */
export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * Preferences that belong to this INSTALL, not to the workspace. The portal owns what is
 * captured; these only decide how the app behaves on this employee's own desktop.
 */
export interface AppPreferences {
  /**
   * Light, dark, or whatever the OS is set to. Held per install rather than per employee:
   * it describes this screen in this room, not the person using it.
   */
  themeMode: ThemeMode;
  /**
   * Closing the window leaves the app running in the tray instead of quitting. On by
   * default: tracking is the whole point, and a stray click on the close button should not
   * silently end someone's working day.
   */
  closeToTray: boolean;
}

/**
 * What the last sync attempt actually did. A sync that uploads nothing is NOT a failure, but
 * it is also not success — the employee is told which of the four it was, every time.
 */
export type SyncOutcome =
  | { kind: 'uploaded'; count: number; discarded: number }
  | { kind: 'nothing' }
  | { kind: 'failed'; reason: string }
  | { kind: 'unavailable'; reason: string };

/** Live counters surfaced to the renderer dashboard once per second. */
export interface LiveStats {
  status: TrackerStatus;
  /** Elapsed active ms in the CURRENT session. */
  sessionActiveMs: number;
  sessionIdleMs: number;
  keyCount: number;
  mouseCount: number;
  currentApp: string;
  /** Screenshots captured this session (that have synced). */
  screenshotCount: number;
  /** Items still waiting in the offline outbox. */
  pendingSync: number;
  lastSyncAt: string | null;
  /** True while an upload is in flight. */
  syncing: boolean;
  /**
   * Active ms worked TODAY, across every session — what the day's progress bar shows.
   *
   * Held here rather than derived in the renderer because it is the portal's number for the
   * day plus the live session on top, and only the main process knows both.
   */
  dayActiveMs: number;
  /** What the last sync attempt did, and why, if it did nothing. */
  lastSyncOutcome: SyncOutcome | null;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  consentRequired?: boolean;
  user?: AuthUser;
}

/** One day of the employee's own tracked time, for the in-app report. */
export interface ReportDay {
  date: string;
  activeMs: number;
  idleMs: number;
  keyCount: number;
  mouseCount: number;
  sessions: number;
}

/** The employee's own report over a date range (their data only). */
export interface MyReport {
  days: ReportDay[];
  totalActiveMs: number;
  totalIdleMs: number;
}

/** One screenshot the employee's own device captured. `imageUrl` is the portal's CDN URL. */
export interface DayScreenshot {
  id: string;
  capturedAt: string;
  imageUrl: string;
  blurred: boolean;
  /**
   * How active (0–100) the interval this shot belongs to was. 0 while that interval is still
   * queued in the outbox — the app uploads a screenshot from INSIDE the interval it belongs
   * to, so the shot can land before its interval does.
   */
  activityPercent: number;
}

/** The employee's all-time tracker totals (portal-side, across every device and session). */
export interface TrackerTotals {
  activeMs: number;
  idleMs: number;
  screenshots: number;
  sessions: number;
}

/** One calendar day of the employee's own work: their totals and their screenshots. */
export interface DayDetail {
  activeMs: number;
  idleMs: number;
  /** Keystrokes are a COUNT only — the tracker never records what was typed. */
  keyCount: number;
  mouseCount: number;
  sessions: number;
  screenshots: DayScreenshot[];
}

/** Renderer → main command channels. */
export const IPC = {
  login: 'tracker:login',
  logout: 'tracker:logout',
  acceptConsent: 'tracker:accept-consent',
  markAttendance: 'tracker:mark-attendance',
  setProject: 'tracker:set-project',
  setTask: 'tracker:set-task',
  start: 'tracker:start',
  pause: 'tracker:pause',
  resume: 'tracker:resume',
  stop: 'tracker:stop',
  getState: 'tracker:get-state',
  getPermissions: 'tracker:get-permissions',
  requestPermission: 'tracker:request-permission',
  openPrivacy: 'tracker:open-privacy',
  getReport: 'tracker:get-report',
  getDay: 'tracker:get-day',
  getTotals: 'tracker:get-totals',
  setTimezone: 'tracker:set-timezone',
  openScreenshots: 'tracker:open-screenshots',
  setPreferences: 'tracker:set-preferences',
  minimizeWindow: 'tracker:minimize-window',
  toggleMaximizeWindow: 'tracker:toggle-maximize-window',
  closeWindow: 'tracker:close-window',
  /** The renderer's answer to a capture request (see `captureRequested`). */
  captureResult: 'tracker:capture-result',
  // main → renderer
  stateChanged: 'tracker:state-changed',
  /** Whether the window this renderer runs in is maximized, for the window controls. */
  windowMaximized: 'tracker:window-maximized',
  /**
   * Main needs the renderer to finish a capture: only a renderer can reach the webcam and a
   * canvas. Answered on `captureResult` with the same request id.
   */
  captureRequested: 'tracker:capture-requested',
  /** Fired on every capture so a renderer can play the shutter sound (audio needs a window). */
  screenshotCaptured: 'tracker:screenshot-captured',
  /**
   * The employee asked to close a window that would quit the app while an upload was in
   * flight. The renderer shows what is still going up; main quits on its own once it lands.
   */
  closeBlocked: 'tracker:close-blocked',
  /** The upload finished (or failed) — the renderer can drop the closing dialog. */
  closeReleased: 'tracker:close-released',
} as const;

/** The full snapshot the renderer renders from. */
export interface TrackerState {
  status: TrackerStatus;
  user: AuthUser | null;
  settings: TrackerSettings | null;
  branding: Branding | null;
  permissions: PermissionState;
  stats: LiveStats;
  /** This install's own preferences (tray behaviour), not the workspace's settings. */
  preferences: AppPreferences;
  /** What HR contracted this employee to work. Null until the portal has been read. */
  workProfile: WorkProfile | null;
  /** Today's target, progress and attendance gate. Null until the portal has been read. */
  workday: Workday | null;
  /** Projects time may be booked against, the house-wide "Global Project" first. */
  projects: TrackerProject[];
  /** The project the next session will book against. Empty means "the first one". */
  selectedProjectId: string;
  /** Tickets on the selected project, the employee's own assigned ones first. */
  tasks: TrackerTask[];
  /** The ticket the next session books against. '' means "the project, no ticket". */
  selectedTaskId: string;
  /** The Legal policy behind the consent screen, when the workspace has chosen one. */
  consentPolicy: ConsentPolicy | null;
  /** Whether the stored session was remembered (drives the login checkbox default). */
  rememberMe: boolean;
  /** Why the app signed the employee out on its own (revoked access), shown on the login screen. */
  signedOutReason: string | null;
  /**
   * The zone EVERY date and time in this app is rendered in: the employee's own pick, else
   * the admin's house default, else this device's zone. Never empty.
   */
  timezone: string;
}

/**
 * What main asks a renderer to produce: the screen it already captured, plus the webcam photo
 * only a renderer can take, composited into one image.
 */
export interface CaptureRequest {
  id: string;
  /** Base64 of the screen capture (no data-URL prefix). */
  screen: string;
  /** The MIME type `screen` is encoded in — PNG at quality 100, JPEG below it. */
  mimeType: string;
  corner: WebcamCorner;
  /** 0-100, applied to the composited result exactly as it was to the screen. */
  quality: number;
}

/** The renderer's answer. `image` is base64 in the same MIME type that was requested. */
export interface CaptureResult {
  id: string;
  image: string | null;
  error: string | null;
}

/** The window the screenshot gallery opens for: one day of the employee's own captures. */
export interface ScreenshotsRange {
  startISO: string;
  endISO: string;
}

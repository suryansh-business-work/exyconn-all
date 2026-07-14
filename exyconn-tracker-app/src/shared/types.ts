/** Shapes shared across the Electron main process, preload bridge and renderer. */

export type TrackerStatus = 'signed-out' | 'consent-required' | 'idle' | 'tracking' | 'paused';

export interface TrackerSettings {
  intervalMinutes: number;
  screenshotsPerInterval: number;
  randomizeScreenshotTiming: boolean;
  blurScreenshots: boolean;
  trackWindowTitles: boolean;
  idleThresholdSeconds: number;
  screenshotMaxWidth: number;
  screenshotQuality: number;
  /** When false, nothing is uploaded until the employee presses "Sync now". */
  autoSyncEnabled: boolean;
  /** How often the outbox is flushed to the portal, in minutes. */
  syncIntervalMinutes: number;
  /** Rich text (HTML) disclosure, authored in the portal and rendered on the consent screen. */
  consentText: string;
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
  /** True when the platform needs no explicit grants (Windows). */
  allGranted: boolean;
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
  /** True while a sync (manual or automatic) is in flight. */
  syncing: boolean;
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
  start: 'tracker:start',
  pause: 'tracker:pause',
  resume: 'tracker:resume',
  stop: 'tracker:stop',
  syncNow: 'tracker:sync-now',
  getState: 'tracker:get-state',
  getPermissions: 'tracker:get-permissions',
  requestPermission: 'tracker:request-permission',
  openPrivacy: 'tracker:open-privacy',
  getReport: 'tracker:get-report',
  getDay: 'tracker:get-day',
  getTotals: 'tracker:get-totals',
  setTimezone: 'tracker:set-timezone',
  openScreenshots: 'tracker:open-screenshots',
  // main → renderer
  stateChanged: 'tracker:state-changed',
  /** Fired on every capture so a renderer can play the shutter sound (audio needs a window). */
  screenshotCaptured: 'tracker:screenshot-captured',
} as const;

/** The full snapshot the renderer renders from. */
export interface TrackerState {
  status: TrackerStatus;
  user: AuthUser | null;
  settings: TrackerSettings | null;
  branding: Branding | null;
  permissions: PermissionState;
  stats: LiveStats;
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

/** The window the screenshot gallery opens for: one day of the employee's own captures. */
export interface ScreenshotsRange {
  startISO: string;
  endISO: string;
}

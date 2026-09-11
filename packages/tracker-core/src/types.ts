/**
 * The tracker's domain, as the portal defines it — shared by the desktop (Electron) and mobile
 * (Expo) apps. Anything that only describes one app's own shell (IPC channels, window and tray
 * preferences, OS permission grants) lives in that app, not here.
 */

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
  /**
   * Unbroken idle time that pauses tracking on its own, in minutes. 0 never pauses.
   *
   * Idle minutes were never counted as work, so this takes nothing away — what it stops is
   * a session left running over lunch or overnight, screenshotting an empty desk.
   */
  idleAutoPauseMinutes: number;
  /** Screenshots are downscaled to this width. Ignored at quality 100. */
  screenshotMaxWidth: number;
  /**
   * 0-100. 100 means ACTUAL best quality — native resolution, encoded losslessly (PNG), no
   * downscale. Below 100 is a JPEG at that quality, downscaled to `screenshotMaxWidth`.
   */
  screenshotQuality: number;
  /**
   * Announce each capture out loud: the camera shutter this app plays, and the sound its
   * capture notification makes. The notification itself is shown either way — muting the
   * sound is never a way to be screenshotted without being told.
   */
  captureSoundEnabled: boolean;
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
 * What the employee has said they are doing right now. Mirrors the portal's TrackerPresence.
 *
 * Their own statement, never something the tracker inferred: a quiet keyboard means the
 * keyboard was quiet, not that somebody went to lunch.
 */
export type PresenceStatus = 'WORKING' | 'LUNCH' | 'BREAK' | 'MEETING' | 'AWAY';

/** The employee's current presence, as the portal holds it. */
export interface PresenceState {
  status: PresenceStatus;
  /** Their own words for it — "back at 2", "client call". Empty when they left it blank. */
  note: string;
  /** ISO instant they last said it; null when they never have. */
  since: string | null;
}

/** A two-way conversation line, or a one-way announcement. Mirrors TrackerMessageKind. */
export type TrackerMessageKind = 'CHAT' | 'NOTICE';

/** Which way a message travelled. Read state belongs to whoever it was going to. */
export type TrackerMessageDirection = 'TO_EMPLOYEE' | 'TO_ADMIN';

/** One message on the employee's own tracker thread. */
export interface TrackerMessage {
  id: string;
  kind: TrackerMessageKind;
  direction: TrackerMessageDirection;
  /** Announcements only — a chat line has no subject. */
  title: string;
  body: string;
  /** Who wrote it, as they were named at the time. Empty for a departed account. */
  authorName: string;
  readAt: string | null;
  createdAt: string;
}

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

/** How the app picks its palette. `system` follows the OS. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** How the day's progress is drawn. */
export type ProgressStyle = 'bar' | 'ring';

/**
 * What the last sync attempt actually did. A sync that uploads nothing is NOT a failure, but
 * it is also not success — the employee is told which of the four it was, every time.
 */
export type SyncOutcome =
  | { kind: 'uploaded'; count: number; discarded: number }
  | { kind: 'nothing' }
  | { kind: 'failed'; reason: string }
  | { kind: 'unavailable'; reason: string };

/** One capture, as the tracking engine reports it to the app shell. */
export interface CaptureEvent {
  /** How many shots the burst took — one per display. */
  count: number;
  /** The instant they were taken. A notification click opens the gallery on THIS day. */
  capturedAt: string;
}

/**
 * What a renderer is told about a capture: the event, plus whether to keep quiet about it.
 *
 * The shell decides `silent` in one place (the workspace setting and this install's own mute
 * together), so the shutter and the notification can never disagree about it.
 */
export interface CaptureAnnouncement extends CaptureEvent {
  silent: boolean;
}

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

/**
 * A report the employee asked to keep a copy of.
 *
 * Composed once, here, from the formatting every other view already uses; each app then
 * decides how the file leaves it — a save dialog on the desktop, the share sheet on a phone.
 */
export interface ReportExport {
  /** Suggested file name, e.g. "tracker-report-2026-09.csv". */
  fileName: string;
  /** The whole file, already formatted. */
  content: string;
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

/**
 * Where this install is in its own update cycle.
 *
 * `failed` is a state and not an error because a tracker that cannot reach its update feed
 * must keep tracking — the employee is told, and the next check tries again.
 */
export type UpdateStage =
  | 'idle'
  | 'checking'
  /**
   * A newer version exists and has NOT been fetched yet.
   *
   * The stage that was missing: the app used to download the moment it found something, so a
   * new version was invisible until it had finished arriving. An employee on a hotel wifi saw
   * nothing at all, and could not have asked for it if they wanted it.
   */
  | 'available'
  | 'downloading'
  | 'ready'
  | 'failed';

export interface UpdateState {
  stage: UpdateStage;
  /** The version waiting to be installed. Empty unless one is downloading or ready. */
  version: string;
  /** Download progress 0-100, while `stage` is 'downloading'. */
  percent: number;
  /**
   * ISO instant of the last completed check, or null before the first one.
   *
   * Without it "Check for updates" is a button that answers a question by doing nothing
   * visible: an up-to-date app returns to `idle`, which looks exactly like never having
   * looked. This is what lets Settings say when it last did.
   */
  lastCheckedAt: string | null;
}

/** Where a claim for off-computer time stands. Mirrors the portal's own enum. */
export type ManualEntryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** One claim for work done away from the computer, as the app lists it. */
export interface ManualEntry {
  id: string;
  /** The project's name as it was when the claim was filed. */
  projectName: string;
  /** The ticket it was against; empty when it was booked to the project only. */
  taskKey: string;
  taskTitle: string;
  /** ISO instants — rendered in the employee's own zone, like everything else here. */
  startedAt: string;
  endedAt: string;
  durationMs: number;
  note: string;
  status: ManualEntryStatus;
  /** Why a reviewer decided as they did. Empty until somebody has. */
  reviewNote: string;
}

/** What the employee fills in to claim time the tracker could not have recorded. */
export interface ManualEntryDraft {
  /** Empty books against the house-wide Global Project. */
  projectId: string;
  /** Empty books against the project without a ticket. */
  taskId: string;
  startedAt: string;
  endedAt: string;
  note: string;
}

/** The window the screenshot gallery opens for: one day of the employee's own captures. */
export interface ScreenshotsRange {
  startISO: string;
  endISO: string;
}

/**
 * Everything the portal records about the device an app runs on (its `TrackerDeviceInput`).
 *
 * `platform` is the OS family the portal files the device under — `win32` / `darwin` for the
 * desktop app, `android` / `ios` for the phone. A field a platform cannot know is sent empty
 * (or 0) rather than guessed: the Devices console shows what was measured, never an invention.
 */
export interface DeviceInfo {
  deviceId: string;
  platform: string;
  hostname: string;
  appVersion: string;
  machineId: string;
  osName: string;
  osVersion: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryMb: number;
  locale: string;
  timezone: string;
  screenCount: number;
  screenResolution: string;
}

/** Time spent in one app (and, where recorded, one window) during an interval. */
export interface WindowUsage {
  appName: string;
  windowTitle: string;
  durationMs: number;
}

/** One closed activity bucket, as it is queued and uploaded. */
export interface IntervalPayload {
  startedAt: string;
  endedAt: string;
  /** Counts only — never which keys. Always 0 on a phone, which cannot count them at all. */
  keyCount: number;
  mouseCount: number;
  activeMs: number;
  idleMs: number;
  windows: WindowUsage[];
}

/** One capture, as it is queued and uploaded. `image` is base64 with no data-URL prefix. */
export interface ScreenshotPayload {
  sessionId: string;
  intervalStartedAt: string;
  capturedAt: string;
  image: string;
  displayId: string;
  blurred: boolean;
}

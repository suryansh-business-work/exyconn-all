/**
 * Shapes the Electron main process, preload bridge and renderer share.
 *
 * The tracker's domain — what the portal sends and receives — is `@exyconn/tracker-core`'s,
 * shared with the mobile app, and is re-exported here so every desktop import keeps one home.
 * What follows it describes this app's own shell: its IPC channels, its macOS permissions, the
 * preferences of this install, and the capture round-trip only a renderer can finish.
 */
import type {
  TrackerState as CoreTrackerState,
  ProgressStyle,
  ThemeMode,
  WebcamCorner,
} from '@exyconn/tracker-core';

export type {
  AttendanceStatus,
  AuthUser,
  Branding,
  CaptureAnnouncement,
  CaptureEvent,
  ConsentPolicy,
  DayDetail,
  DayScreenshot,
  LiveStats,
  LoginResult,
  ManualEntry,
  ManualEntryDraft,
  ManualEntryStatus,
  MyReport,
  PresenceState,
  PresenceStatus,
  ProgressStyle,
  ReportDay,
  ReportExport,
  ScreenshotsRange,
  SyncOutcome,
  ThemeMode,
  TrackerMessage,
  TrackerMessageDirection,
  TrackerMessageKind,
  TrackerProject,
  TrackerSettings,
  TrackerStatus,
  TrackerTask,
  TrackerTotals,
  UpdateStage,
  UpdateState,
  WebcamCorner,
  WorkLocation,
  WorkProfile,
  Workday,
  WorkingTime,
} from '@exyconn/tracker-core';

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
  /**
   * Silences the capture sound on THIS computer, whatever the workspace has set.
   *
   * An employee on a call, or sitting next to somebody who is, should not have to ask an
   * administrator to stop a shutter firing in the room — so this mutes it for them alone.
   * It only ever silences: the capture notification still appears on every capture.
   */
  muteCaptureSound: boolean;
  /**
   * How today's progress is drawn: a bar across the card, or a ring around the figure.
   *
   * Purely a display choice — both read the same number. The ring puts the percentage in
   * the middle of the shape it describes, which is easier to take in at a glance on a
   * window this narrow; the bar shows the remainder as a length, which some people prefer.
   */
  progressStyle: ProgressStyle;
  /**
   * Keep the app current without being asked: a new version downloads in the background as
   * soon as it appears, and installs itself (a quiet restart) whenever no session is running —
   * never mid-session. Off, a new version is only announced, and fetched and installed when
   * the employee presses the buttons for it.
   */
  updateAutomatically: boolean;
}

/** Where a saved report landed, or null when the employee cancelled the dialog. */
export interface SavedReport {
  path: string | null;
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
  getTasks: 'tracker:get-tasks',
  getManualEntries: 'tracker:get-manual-entries',
  createManualEntry: 'tracker:create-manual-entry',
  withdrawManualEntry: 'tracker:withdraw-manual-entry',
  /** Says what the employee is doing — at lunch, on a break, in a meeting. */
  setPresence: 'tracker:set-presence',
  /** The employee's own thread with the tracker desk, or the announcements sent to them. */
  getMessages: 'tracker:get-messages',
  sendMessage: 'tracker:send-message',
  markMessagesRead: 'tracker:mark-messages-read',
  /** Writes the month's report to a file the employee chooses. */
  saveReport: 'tracker:save-report',
  /** This install's own version, for the About panel — the number an update compares against. */
  getAppVersion: 'tracker:get-app-version',
  getUpdate: 'tracker:get-update',
  /** Looks for a newer version right now, rather than waiting for the next scheduled check. */
  checkForUpdate: 'tracker:check-for-update',
  /** Starts fetching an available version. Returns immediately — the download is background. */
  downloadUpdate: 'tracker:download-update',
  installUpdate: 'tracker:install-update',
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
   * The employee clicked a capture notification and wants to see the shot. Carries the
   * instant it was captured at; the renderer turns that into the day's bounds IN THE ZONE IT
   * RENDERS EVERYTHING ELSE and opens the gallery on it.
   */
  openCaptureDay: 'tracker:open-capture-day',
  /**
   * The employee asked to close a window that would quit the app while an upload was in
   * flight. The renderer shows what is still going up; main quits on its own once it lands.
   */
  closeBlocked: 'tracker:close-blocked',
  /** The upload finished (or failed) — the renderer can drop the closing dialog. */
  closeReleased: 'tracker:close-released',
  /** A new version is being looked for, downloaded, or is ready to install. */
  updateChanged: 'tracker:update-changed',
} as const;

/** The full snapshot the renderer renders from: core's state, with this app's own shell. */
export type TrackerState = CoreTrackerState<PermissionState, AppPreferences>;

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

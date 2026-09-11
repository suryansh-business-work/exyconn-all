import { contextBridge, ipcRenderer } from 'electron';
import type { LogBatch } from '@exyconn/logger';
import {
  IPC,
  type AppPreferences,
  type AttendanceStatus,
  type CaptureAnnouncement,
  type CaptureRequest,
  type CaptureResult,
  type DayDetail,
  type LoginResult,
  type ManualEntry,
  type ManualEntryDraft,
  type PermissionKind,
  type PermissionState,
  type PresenceState,
  type PresenceStatus,
  type ReportDay,
  type ReportExport,
  type SavedReport,
  type ScreenshotsRange,
  type TrackerMessage,
  type TrackerMessageKind,
  type TrackerState,
  type TrackerTask,
  type TrackerTotals,
  type UpdateState,
  type Workday,
} from '@shared/types';

/** The typed API exposed to the renderer over the context bridge (no Node access). */
const api = {
  getState: (): Promise<TrackerState> => ipcRenderer.invoke(IPC.getState),
  /** One batch of this window's Tech > Logs entries; main adds the device and user, then sends it. */
  reportLogs: (batch: LogBatch): Promise<boolean> => ipcRenderer.invoke(IPC.reportLogs, batch),
  login: (email: string, password: string, rememberMe: boolean): Promise<LoginResult> =>
    ipcRenderer.invoke(IPC.login, email, password, rememberMe),
  logout: (): Promise<void> => ipcRenderer.invoke(IPC.logout),
  /** `signedName` is the employee's typed signature on the disclosure. */
  acceptConsent: (signedName: string): Promise<void> =>
    ipcRenderer.invoke(IPC.acceptConsent, signedName),
  /** Marks the employee in for today; resolves to the day as the portal now sees it. */
  markAttendance: (status: AttendanceStatus, note: string | null): Promise<Workday> =>
    ipcRenderer.invoke(IPC.markAttendance, status, note),
  /** Chooses the project the next session books against; resolves to the project now in force. */
  setProject: (projectId: string): Promise<string> => ipcRenderer.invoke(IPC.setProject, projectId),
  setTask: (taskId: string): Promise<string> => ipcRenderer.invoke(IPC.setTask, taskId),
  start: (): Promise<void> => ipcRenderer.invoke(IPC.start),
  pause: (): Promise<void> => ipcRenderer.invoke(IPC.pause),
  resume: (): Promise<void> => ipcRenderer.invoke(IPC.resume),
  stop: (): Promise<void> => ipcRenderer.invoke(IPC.stop),
  getReport: (from: string, to: string): Promise<ReportDay[]> =>
    ipcRenderer.invoke(IPC.getReport, from, to),
  getDay: (start: string, end: string): Promise<DayDetail> =>
    ipcRenderer.invoke(IPC.getDay, start, end),
  /** The employee's own all-time totals, for the dashboard's "All time" tiles. */
  getTotals: (): Promise<TrackerTotals> => ipcRenderer.invoke(IPC.getTotals),
  /** Persists the employee's chosen zone; resolves to the zone now in force. */
  setTimezone: (timezone: string): Promise<string> => ipcRenderer.invoke(IPC.setTimezone, timezone),
  /** Opens the screenshot gallery in a separate window (or focuses the open one). */
  openScreenshots: (range: ScreenshotsRange): Promise<void> =>
    ipcRenderer.invoke(IPC.openScreenshots, range),
  getPermissions: (): Promise<PermissionState> => ipcRenderer.invoke(IPC.getPermissions),
  requestPermission: (kind: PermissionKind): Promise<void> =>
    ipcRenderer.invoke(IPC.requestPermission, kind),
  /** Updates this install's own preferences (tray behaviour); resolves to the full set. */
  setPreferences: (update: Partial<AppPreferences>): Promise<AppPreferences> =>
    ipcRenderer.invoke(IPC.setPreferences, update),

  // ── Off-computer time ───────────────────────────────────────────────────
  // Claimed hours nobody measured, so every one of these lands PENDING and counts for
  // nothing until a manager approves it in the portal.
  /** Tickets on one project, for the claim form — does not change the session's own pick. */
  getTasks: (projectId: string): Promise<TrackerTask[]> =>
    ipcRenderer.invoke(IPC.getTasks, projectId),
  getManualEntries: (from: string, to: string): Promise<ManualEntry[]> =>
    ipcRenderer.invoke(IPC.getManualEntries, from, to),
  createManualEntry: (draft: ManualEntryDraft): Promise<ManualEntry> =>
    ipcRenderer.invoke(IPC.createManualEntry, draft),
  /** Only works while the claim is still pending; the portal refuses a decided one. */
  withdrawManualEntry: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC.withdrawManualEntry, id),

  // ── Presence, messages and exports ──────────────────────────────────────
  /**
   * Says what the employee is doing. Every status but Working pauses a running session —
   * a tracker that kept counting through lunch would bill lunch as work.
   */
  setPresence: (status: PresenceStatus, note: string): Promise<PresenceState> =>
    ipcRenderer.invoke(IPC.setPresence, status, note),
  /** Their own thread with the tracker desk ('CHAT'), or the announcements sent to them. */
  getMessages: (kind: TrackerMessageKind): Promise<TrackerMessage[]> =>
    ipcRenderer.invoke(IPC.getMessages, kind),
  sendMessage: (body: string): Promise<TrackerMessage> => ipcRenderer.invoke(IPC.sendMessage, body),
  /** Clears the unread badge for one kind; resolves to how many were marked. */
  markMessagesRead: (kind: TrackerMessageKind): Promise<number> =>
    ipcRenderer.invoke(IPC.markMessagesRead, kind),
  /**
   * Writes a report the renderer has already composed to a file the employee picks.
   * Resolves with a null path when they cancel the dialog, which is not an error.
   */
  saveReport: (report: ReportExport): Promise<SavedReport> =>
    ipcRenderer.invoke(IPC.saveReport, report),

  // ── Updates ─────────────────────────────────────────────────────────────
  /** The version this install is running — what the About panel shows. */
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC.getAppVersion),
  /** Where this install is in its own update cycle, for a window that has just opened. */
  getUpdate: (): Promise<UpdateState> => ipcRenderer.invoke(IPC.getUpdate),
  /** Looks for a newer version now. Progress and the outcome arrive on `onUpdateChanged`. */
  checkForUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.checkForUpdate),
  /** Starts fetching an available version. Progress arrives on `onUpdateChanged`. */
  downloadUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.downloadUpdate),
  /** Stops tracking, flushes what is queued, and restarts into the downloaded version. */
  installUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.installUpdate),
  onUpdateChanged: (listener: (update: UpdateState) => void): (() => void) => {
    const handler = (_event: unknown, update: UpdateState): void => listener(update);
    ipcRenderer.on(IPC.updateChanged, handler);
    return () => ipcRenderer.removeListener(IPC.updateChanged, handler);
  },

  // ── Window controls ─────────────────────────────────────────────────────
  // The app is frameless, so its own title bar drives these. Each acts on the window it was
  // called from, so the gallery's buttons never reach the tracker window.
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke(IPC.minimizeWindow),
  /** Toggles maximise; resolves to whether the window ended up maximized. */
  toggleMaximizeWindow: (): Promise<boolean> => ipcRenderer.invoke(IPC.toggleMaximizeWindow),
  closeWindow: (): Promise<void> => ipcRenderer.invoke(IPC.closeWindow),
  onWindowMaximized: (listener: (maximized: boolean) => void): (() => void) => {
    const handler = (_event: unknown, maximized: boolean): void => listener(maximized);
    ipcRenderer.on(IPC.windowMaximized, handler);
    return () => ipcRenderer.removeListener(IPC.windowMaximized, handler);
  },
  openPrivacy: (): Promise<void> => ipcRenderer.invoke(IPC.openPrivacy),
  onStateChanged: (listener: (state: TrackerState) => void): (() => void) => {
    const handler = (_event: unknown, state: TrackerState): void => listener(state);
    ipcRenderer.on(IPC.stateChanged, handler);
    return () => ipcRenderer.removeListener(IPC.stateChanged, handler);
  },
  /**
   * A screenshot was just captured — the renderer plays the shutter sound, unless the
   * announcement says to keep quiet. Main decides that, so the sound and the notification
   * can never disagree about whether this capture was muted.
   */
  onScreenshotCaptured: (listener: (capture: CaptureAnnouncement) => void): (() => void) => {
    const handler = (_event: unknown, capture: CaptureAnnouncement): void => listener(capture);
    ipcRenderer.on(IPC.screenshotCaptured, handler);
    return () => ipcRenderer.removeListener(IPC.screenshotCaptured, handler);
  },
  /**
   * The employee clicked a capture notification. Carries the instant the shot was taken; the
   * renderer resolves that to a day in ITS zone and opens the gallery on it.
   */
  onOpenCaptureDay: (listener: (capturedAt: string) => void): (() => void) => {
    const handler = (_event: unknown, capturedAt: string): void => listener(capturedAt);
    ipcRenderer.on(IPC.openCaptureDay, handler);
    return () => ipcRenderer.removeListener(IPC.openCaptureDay, handler);
  },
  /**
   * Main needs this renderer to finish a capture — take the webcam photo and composite it —
   * because a camera and a canvas exist here and nowhere in the main process. The listener
   * answers on `sendCaptureResult` with the same request id.
   */
  onCaptureRequested: (listener: (request: CaptureRequest) => void): (() => void) => {
    const handler = (_event: unknown, request: CaptureRequest): void => listener(request);
    ipcRenderer.on(IPC.captureRequested, handler);
    return () => ipcRenderer.removeListener(IPC.captureRequested, handler);
  },
  sendCaptureResult: (result: CaptureResult): void => {
    ipcRenderer.send(IPC.captureResult, result);
  },
  /**
   * A quit is being held because an upload is still going up. `pending` is how many items
   * were queued when it was held, so the dialog can say what it is waiting for.
   */
  onCloseBlocked: (listener: (pending: number) => void): (() => void) => {
    const handler = (_event: unknown, pending: number): void => listener(pending);
    ipcRenderer.on(IPC.closeBlocked, handler);
    return () => ipcRenderer.removeListener(IPC.closeBlocked, handler);
  },
  /** The upload landed (or the wait ran out) — the app is quitting, drop the dialog. */
  onCloseReleased: (listener: () => void): (() => void) => {
    const handler = (): void => listener();
    ipcRenderer.on(IPC.closeReleased, handler);
    return () => ipcRenderer.removeListener(IPC.closeReleased, handler);
  },
};

export type TrackerApi = typeof api;

contextBridge.exposeInMainWorld('tracker', api);

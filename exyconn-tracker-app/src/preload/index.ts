import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC,
  type AppPreferences,
  type CaptureRequest,
  type CaptureResult,
  type DayDetail,
  type LoginResult,
  type PermissionKind,
  type PermissionState,
  type ReportDay,
  type ScreenshotsRange,
  type SyncOutcome,
  type TrackerState,
  type TrackerTotals,
} from '@shared/types';

/** The typed API exposed to the renderer over the context bridge (no Node access). */
const api = {
  getState: (): Promise<TrackerState> => ipcRenderer.invoke(IPC.getState),
  login: (email: string, password: string, rememberMe: boolean): Promise<LoginResult> =>
    ipcRenderer.invoke(IPC.login, email, password, rememberMe),
  logout: (): Promise<void> => ipcRenderer.invoke(IPC.logout),
  acceptConsent: (): Promise<void> => ipcRenderer.invoke(IPC.acceptConsent),
  start: (): Promise<void> => ipcRenderer.invoke(IPC.start),
  pause: (): Promise<void> => ipcRenderer.invoke(IPC.pause),
  resume: (): Promise<void> => ipcRenderer.invoke(IPC.resume),
  stop: (): Promise<void> => ipcRenderer.invoke(IPC.stop),
  syncNow: (): Promise<SyncOutcome> => ipcRenderer.invoke(IPC.syncNow),
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
  /** A screenshot was just captured — the renderer plays the shutter sound. */
  onScreenshotCaptured: (listener: (count: number) => void): (() => void) => {
    const handler = (_event: unknown, count: number): void => listener(count);
    ipcRenderer.on(IPC.screenshotCaptured, handler);
    return () => ipcRenderer.removeListener(IPC.screenshotCaptured, handler);
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
};

export type TrackerApi = typeof api;

contextBridge.exposeInMainWorld('tracker', api);

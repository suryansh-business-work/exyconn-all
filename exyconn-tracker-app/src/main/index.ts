import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import { join } from 'node:path';
import {
  IPC,
  type AppPreferences,
  type CaptureAnnouncement,
  type AttendanceStatus,
  type ManualEntryDraft,
  type PermissionKind,
  type PresenceStatus,
  type ReportExport,
  type ScreenshotsRange,
  type TrackerMessageKind,
  type TrackerState,
  type UpdateState,
} from '@shared/types';
import { TrackerController } from './controller';
import type { CaptureReport } from './engine';
import { notifyScreenshotCaptured } from './notifier';
import { TrackerTray } from './tray';
import { closeScreenshotsWindow, openScreenshotsWindow } from './screenshots-window';
import { composeWithWebcam, registerCaptureBridge } from './capture-bridge';
import { applyWindowChrome, registerWindowControls } from './window-chrome';
import { holdForUpload, type CloseGuardHooks } from './close-guard';
import { secureStore } from './store';
import { AppUpdater } from './updater';
import { saveReportFile } from './report-file';
import { PORTAL_GRAPHQL_URL } from './portal-client';

/**
 * This app's Windows AppUserModelID. Kept identical to `appId` in electron-builder.yml, which
 * `app-user-model-id.test.ts` enforces: a mismatch costs the app every Windows notification,
 * silently.
 */
const APP_USER_MODEL_ID = 'com.exyconn.timetracker';

let window: BrowserWindow | null = null;
let tray: TrackerTray | null = null;
let controller: TrackerController | null = null;
const updater = new AppUpdater((update) => announceUpdate(update));

function broadcast(state: TrackerState): void {
  window?.webContents.send(IPC.stateChanged, state);
  tray?.update(state);
}

/**
 * Whether this capture must be silent.
 *
 * TWO mutes, either of which is enough: the workspace's (an administrator has decided the
 * shutter is disruptive for everybody) and this install's (the employee has muted it on their
 * own machine, without needing an administrator). Decided once, here, so the shutter and the
 * notification can never disagree — and neither of them hides the capture, which is still
 * announced on screen either way.
 */
function captureIsSilent(): boolean {
  const workspaceWantsSound = controller?.getState().settings?.captureSoundEnabled ?? true;
  return !workspaceWantsSound || secureStore().preferences.muteCaptureSound;
}

/**
 * Announces a capture: the OS notification (which shows the shot and opens it when clicked)
 * and the camera shutter.
 *
 * The shutter has to make the hop to a renderer because audio can only play in one — and it
 * goes to the main window specifically (not every window), or an open gallery would play a
 * second shutter. A hidden or minimised window still runs JS and still plays audio, which is
 * the whole point: the tracker is usually in the tray when a capture fires.
 */
function announceCapture(report: CaptureReport): void {
  const silent = captureIsSilent();
  const announcement: CaptureAnnouncement = { ...report.capture, silent };
  window?.webContents.send(IPC.screenshotCaptured, announcement);
  notifyScreenshotCaptured(report.capture, report.stats, {
    image: report.preview,
    silent,
    onOpen: () => openCaptureDay(report.capture.capturedAt),
  });
}

/**
 * Opens the gallery on the day a capture belongs to, because its notification was clicked.
 *
 * The day's bounds depend on the employee's own timezone, and the renderer is where this app
 * turns an instant into a day — so it is asked, rather than the arithmetic being written a
 * second time here. It answers by opening the gallery window, which is the one that gets
 * focus; the tracker window stays wherever it was, usually the tray, because a hidden window
 * still runs its JS and a click on a screenshot asked for the screenshot, not the dashboard.
 *
 * A sync is kicked off alongside, because the shot they just clicked is still sitting in the
 * outbox — the gallery reads the portal, so without this the one screenshot they came to see
 * is the one that is not there yet.
 */
function openCaptureDay(capturedAt: string): void {
  window?.webContents.send(IPC.openCaptureDay, capturedAt);
  controller?.syncNow().catch((error: unknown) => {
    console.error('Sync after a capture notification failed', error);
  });
}

/** Tells the window where this install is in its own update cycle. */
function announceUpdate(update: UpdateState): void {
  window?.webContents.send(IPC.updateChanged, update);
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 380,
    minHeight: 560,
    show: false,
    // No OS chrome: the tracker draws its own title bar, so minimise/maximise/close are part
    // of the app rather than a strip of Windows or macOS bolted to the top of it.
    frame: false,
    title: 'Exyconn Tracker',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Chromium throttles timers in a backgrounded window. The shutter sound is triggered by
      // an IPC message rather than a timer, but the renderer must stay responsive enough to
      // play it while the app sits hidden in the tray, which is where it usually is.
      backgroundThrottling: false,
    },
  });

  win.on('ready-to-show', () => win.show());
  applyWindowChrome(win);
  /**
   * Closing the window leaves the app running in the tray, unless the employee has turned
   * that off in Settings — in which case close means quit, and tracking stops with it.
   */
  win.on('close', (event) => {
    if (!isQuitting && secureStore().preferences.closeToTray) {
      event.preventDefault();
      win.hide();
      return;
    }
    // Quitting for real. If an upload is still going up, hold the window open, say so, and
    // let the guard quit once it lands — closing now would make that work climb twice.
    if (waitForUpload(win, event)) {
      return;
    }
    isQuitting = true;
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return win;
}

let isQuitting = false;

/**
 * What the close guard needs to know, read live rather than captured: `syncing` flips while
 * the guard is waiting, which is the whole point of waiting.
 */
function uploadHooks(): CloseGuardHooks {
  return {
    isSyncing: () => controller?.getState().stats.syncing ?? false,
    pending: () => controller?.getState().stats.pendingSync ?? 0,
    release: () => {
      isQuitting = true;
      app.quit();
    },
  };
}

/**
 * Holds a real quit while an upload is in flight. Returns true when the close was held, in
 * which case the guard quits the app itself once the upload lands or the wait runs out.
 */
function waitForUpload(win: BrowserWindow, event: Electron.Event): boolean {
  const held = holdForUpload(win, uploadHooks());
  if (held) {
    event.preventDefault();
  }
  return held;
}

function registerIpc(ctrl: TrackerController): void {
  ipcMain.handle(IPC.getState, () => ctrl.getState());
  ipcMain.handle(IPC.login, (_e, email: string, password: string, rememberMe: boolean) =>
    ctrl.login(email, password, rememberMe),
  );
  ipcMain.handle(IPC.logout, async () => {
    // The gallery is showing the screenshots of the employee who is signing out.
    closeScreenshotsWindow();
    await ctrl.logout();
  });
  ipcMain.handle(IPC.acceptConsent, (_e, signedName: string) => ctrl.acceptConsent(signedName));
  ipcMain.handle(IPC.markAttendance, (_e, status: AttendanceStatus, note: string | null) =>
    ctrl.markAttendance(status, note),
  );
  ipcMain.handle(IPC.setProject, (_e, projectId: string) => ctrl.setProject(projectId));
  ipcMain.handle(IPC.setTask, (_e, taskId: string) => ctrl.setTask(taskId));
  ipcMain.handle(IPC.start, () => ctrl.start());
  ipcMain.handle(IPC.pause, () => ctrl.pause());
  ipcMain.handle(IPC.resume, () => ctrl.resume());
  ipcMain.handle(IPC.stop, () => ctrl.stop());
  ipcMain.handle(IPC.getReport, (_e, from: string, to: string) => ctrl.getReport(from, to));
  ipcMain.handle(IPC.getDay, (_e, start: string, end: string) => ctrl.getDay(start, end));
  ipcMain.handle(IPC.getTotals, () => ctrl.getTotals());
  ipcMain.handle(IPC.setTimezone, (_e, timezone: string) => ctrl.setTimezone(timezone));
  ipcMain.handle(IPC.openScreenshots, (_e, range: ScreenshotsRange) => {
    if (window !== null) {
      openScreenshotsWindow(window, range);
    }
  });
  ipcMain.handle(IPC.getPermissions, () => ctrl.refreshPermissions());
  ipcMain.handle(IPC.requestPermission, (_e, kind: PermissionKind) => ctrl.requestPermission(kind));
  ipcMain.handle(IPC.setPreferences, (_e, update: Partial<AppPreferences>) => {
    const preferences = ctrl.setPreferences(update);
    // Applied to the live updater, not just stored: turning background updates on is a
    // request for the version already waiting, not a preference for the next launch.
    updater.setAutoDownload(preferences.autoUpdate);
    return preferences;
  });
  ipcMain.handle(IPC.getTasks, (_e, projectId: string) => ctrl.getTasks(projectId));
  ipcMain.handle(IPC.getManualEntries, (_e, from: string, to: string) =>
    ctrl.getManualEntries(from, to),
  );
  ipcMain.handle(IPC.createManualEntry, (_e, draft: ManualEntryDraft) =>
    ctrl.createManualEntry(draft),
  );
  ipcMain.handle(IPC.withdrawManualEntry, (_e, id: string) => ctrl.withdrawManualEntry(id));
  ipcMain.handle(IPC.setPresence, (_e, status: PresenceStatus, note: string) =>
    ctrl.setPresence(status, note),
  );
  ipcMain.handle(IPC.getMessages, (_e, kind: TrackerMessageKind) => ctrl.getMessages(kind));
  ipcMain.handle(IPC.sendMessage, (_e, body: string) => ctrl.sendMessage(body));
  ipcMain.handle(IPC.markMessagesRead, (_e, kind: TrackerMessageKind) =>
    ctrl.markMessagesRead(kind),
  );
  // The dialog belongs to the tracker window, so it opens attached to it rather than
  // floating loose over whatever the employee was actually looking at.
  ipcMain.handle(IPC.saveReport, (_e, report: ReportExport) => saveReportFile(window, report));
  ipcMain.handle(IPC.getAppVersion, () => app.getVersion());
  ipcMain.handle(IPC.getUpdate, () => updater.current);
  ipcMain.handle(IPC.checkForUpdate, () => updater.checkNow());
  // Fire-and-forget on purpose: the renderer gets a progress bar off the state channel, not a
  // promise it has to sit on while a few hundred megabytes arrive.
  ipcMain.handle(IPC.downloadUpdate, () => updater.download());
  /**
   * Restart into the new version. The session is stopped first so the minutes worked up to
   * this moment are flushed — an update must never cost the employee their afternoon.
   */
  ipcMain.handle(IPC.installUpdate, async () => {
    await ctrl.stop();
    isQuitting = true;
    updater.install();
  });
  ipcMain.handle(IPC.openPrivacy, () =>
    shell.openExternal('https://portal.exyconn.com/me/tracker'),
  );
}

/**
 * What the app's own pages may ask Chromium for.
 *
 * Only `media` — the webcam photo — and only for the tracker's own windows. Electron grants
 * every permission by default, and an employee-monitoring app that silently held a
 * microphone, geolocation or notification-spam permission it never uses would be exactly the
 * thing this app spends its consent screen promising it is not.
 */
function lockDownPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === 'media');
  });
}

// A single instance only — a second launch focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    window?.show();
    window?.focus();
  });

  void app.whenReady().then(async () => {
    // Windows silently drops every toast from an app it cannot identify, which is one of the
    // ways "the tracker never notifies me" happens. Must match electron-builder's appId — the
    // installer stamps that same id on the Start Menu shortcut, and the two have to agree.
    app.setAppUserModelId(APP_USER_MODEL_ID);
    lockDownPermissions();
    registerCaptureBridge();
    registerWindowControls();
    controller = new TrackerController(broadcast, announceCapture, (input) =>
      composeWithWebcam(window, input),
    );
    window = createWindow();
    tray = new TrackerTray(window, {
      // Start can now be refused — attendance has to be marked for the day first — so the
      // tray's own Start must not drop that rejection on the floor.
      start: () => {
        controller?.start().catch((error: unknown) => console.error('Tray start refused', error));
      },
      pause: () => controller?.pause(),
      resume: () => controller?.resume(),
      stop: () => void controller?.stop(),
      quit: () => {
        // Same hold as the window's close button: the tray must not be a way around it.
        if (window !== null && holdForUpload(window, uploadHooks())) {
          return;
        }
        isQuitting = true;
        app.quit();
      },
    });
    registerIpc(controller);
    // Only a packaged app has an installer to replace; in dev there is nothing to update.
    if (app.isPackaged) {
      updater.start(PORTAL_GRAPHQL_URL, secureStore().preferences.autoUpdate);
    }
    await controller.restore();
    broadcast(controller.getState());
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // Stay alive in the tray; do not quit on window close (except when quitting explicitly).
  if (isQuitting) {
    app.quit();
  }
});

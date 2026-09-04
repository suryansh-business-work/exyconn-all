import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import { join } from 'node:path';
import {
  IPC,
  type AppPreferences,
  type AttendanceStatus,
  type PermissionKind,
  type ScreenshotsRange,
  type TrackerState,
} from '@shared/types';
import { TrackerController } from './controller';
import { TrackerTray } from './tray';
import { closeScreenshotsWindow, openScreenshotsWindow } from './screenshots-window';
import { composeWithWebcam, registerCaptureBridge } from './capture-bridge';
import { applyWindowChrome, registerWindowControls } from './window-chrome';
import { holdForUpload, type CloseGuardHooks } from './close-guard';
import { secureStore } from './store';

let window: BrowserWindow | null = null;
let tray: TrackerTray | null = null;
let controller: TrackerController | null = null;

function broadcast(state: TrackerState): void {
  window?.webContents.send(IPC.stateChanged, state);
  tray?.update(state);
}

/**
 * Announces a capture to the main window so it can play the shutter sound. Audio can only
 * play in a renderer, so the sound has to make this hop — and it is sent to the main window
 * specifically (not every window), or an open gallery would play a second shutter.
 *
 * A hidden or minimised window still runs JS and still plays audio, which is the whole point:
 * the tracker is usually in the tray when a capture fires, and it must still be audible.
 */
function announceCapture(count: number): void {
  window?.webContents.send(IPC.screenshotCaptured, count);
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
  ipcMain.handle(IPC.setPreferences, (_e, update: Partial<AppPreferences>) =>
    ctrl.setPreferences(update),
  );
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

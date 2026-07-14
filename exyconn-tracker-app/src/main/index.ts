import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { IPC, type ScreenshotsRange, type TrackerState } from '@shared/types';
import { TrackerController } from './controller';
import { TrackerTray } from './tray';
import { closeScreenshotsWindow, openScreenshotsWindow } from './screenshots-window';

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
    height: 640,
    resizable: false,
    show: false,
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
  // Keep the app resident in the tray when the window is closed, rather than quitting.
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
  return win;
}

let isQuitting = false;

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
  ipcMain.handle(IPC.acceptConsent, () => ctrl.acceptConsent());
  ipcMain.handle(IPC.start, () => ctrl.start());
  ipcMain.handle(IPC.pause, () => ctrl.pause());
  ipcMain.handle(IPC.resume, () => ctrl.resume());
  ipcMain.handle(IPC.stop, () => ctrl.stop());
  ipcMain.handle(IPC.syncNow, () => ctrl.syncNow());
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
  ipcMain.handle(IPC.requestPermission, (_e, kind: 'screenRecording' | 'accessibility') =>
    ctrl.requestPermission(kind),
  );
  ipcMain.handle(IPC.openPrivacy, () =>
    shell.openExternal('https://portal.exyconn.com/me/tracker'),
  );
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
    controller = new TrackerController(broadcast, announceCapture);
    window = createWindow();
    tray = new TrackerTray(window, {
      start: () => void controller?.start(),
      pause: () => controller?.pause(),
      resume: () => controller?.resume(),
      stop: () => void controller?.stop(),
      quit: () => {
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

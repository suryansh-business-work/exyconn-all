import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '@shared/types';

/**
 * The tracker draws its own title bar, so minimise / maximise / close arrive over IPC from
 * the renderer instead of from OS chrome.
 *
 * Every handler acts on the window the message CAME FROM, never on a captured reference:
 * the same preload (and the same title bar) is shared by the tracker window and the
 * screenshot gallery, and a close button that always closed the main window would be a trap
 * in the gallery.
 */
function senderWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

/** Wired once at startup, for every window that uses the shared preload. */
export function registerWindowControls(): void {
  ipcMain.handle(IPC.minimizeWindow, (event) => senderWindow(event)?.minimize());
  ipcMain.handle(IPC.closeWindow, (event) => senderWindow(event)?.close());
  ipcMain.handle(IPC.toggleMaximizeWindow, (event) => {
    const win = senderWindow(event);
    if (!win) {
      return false;
    }
    if (win.isMaximized()) {
      win.unmaximize();
      return false;
    }
    win.maximize();
    return true;
  });
}

/**
 * Keeps a window's maximise button honest. Without this the button still toggles, but its
 * icon goes stale the moment the window is maximised by any other route — a double-click on
 * the title bar, a snap gesture, or the OS restoring a maximised window on launch.
 */
export function applyWindowChrome(win: BrowserWindow): void {
  const report = (maximized: boolean): void => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.windowMaximized, maximized);
    }
  };

  win.on('maximize', () => report(true));
  win.on('unmaximize', () => report(false));
  win.on('enter-full-screen', () => report(true));
  win.on('leave-full-screen', () => report(false));
  // The renderer mounts after these events would have fired, so state it once it can hear.
  win.webContents.on('did-finish-load', () => report(win.isMaximized()));
}

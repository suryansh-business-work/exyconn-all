import { BrowserWindow } from 'electron';
import { join } from 'node:path';
import type { ScreenshotsRange } from '@shared/types';

/**
 * The screenshot gallery is a REAL second window, not a dialog inside the tracker: the main
 * window is a fixed 420px column, and an employee reviewing what was captured of their own
 * screen deserves to see it at a size where they can actually read it.
 *
 * Exactly one gallery exists at a time. Clicking screenshots again focuses the window that is
 * already open (and re-points it at the new day) instead of stacking up windows, and the
 * reference is dropped on 'closed' so a closed window is never reused or leaked.
 */
let gallery: BrowserWindow | null = null;
/** The day the open gallery is showing, so we only reload when it actually changes. */
let showing: string | null = null;

/** The gallery's own renderer entry — a second HTML page, built by electron-vite. */
function load(win: BrowserWindow, range: ScreenshotsRange): void {
  const query = { start: range.startISO, end: range.endISO };
  const devUrl = process.env.ELECTRON_RENDERER_URL;

  if (devUrl) {
    const url = new URL('screenshots.html', `${devUrl}/`);
    url.search = new URLSearchParams(query).toString();
    win.loadURL(url.toString()).catch((cause: unknown) => {
      console.error('Screenshot gallery failed to load', cause);
    });
    return;
  }

  win
    .loadFile(join(__dirname, '../renderer/screenshots.html'), { query })
    .catch((cause: unknown) => {
      console.error('Screenshot gallery failed to load', cause);
    });
}

function create(parent: BrowserWindow): BrowserWindow {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 480,
    show: false,
    title: 'My screenshots — Exyconn Tracker',
    // Not `parent`/`modal`: the gallery is a peer window the employee can leave open and
    // move to another monitor while they keep working, not a lightbox over the tracker.
    backgroundColor: parent.getBackgroundColor(),
    webPreferences: {
      // The SAME preload, so `window.tracker` works here exactly as in the main window and the
      // gallery reaches the portal only through the main process — never with its own token.
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.on('ready-to-show', () => win.show());
  win.on('closed', () => {
    // Dereference. A destroyed BrowserWindow that is still held would throw on the next
    // `.focus()` — this is the leak/crash the "focus the existing one" path depends on.
    gallery = null;
    showing = null;
  });

  return win;
}

/** Opens the gallery for one day of the employee's own screenshots, or focuses the open one. */
export function openScreenshotsWindow(parent: BrowserWindow, range: ScreenshotsRange): void {
  const wanted = `${range.startISO}/${range.endISO}`;

  if (gallery !== null && !gallery.isDestroyed()) {
    if (showing !== wanted) {
      showing = wanted;
      load(gallery, range);
    }
    if (gallery.isMinimized()) {
      gallery.restore();
    }
    gallery.focus();
    return;
  }

  gallery = create(parent);
  showing = wanted;
  load(gallery, range);
}

/** Closes the gallery — used when the employee signs out; their shots are not for the next user. */
export function closeScreenshotsWindow(): void {
  if (gallery !== null && !gallery.isDestroyed()) {
    gallery.close();
  }
}

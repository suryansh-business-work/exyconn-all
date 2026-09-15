import { app, ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The tracker's windows only ever show its own pages: the dev server in development, the
 * built renderer files in the packaged app. Anything else — a link, a redirect, a page that
 * an injected script navigates to — must neither load inside a window that holds the
 * privileged preload API nor be able to call that API over IPC.
 */

type InvokeListener = Parameters<typeof ipcMain.handle>[1];
type MessageListener = Parameters<typeof ipcMain.on>[1];

/** Where the built renderer pages live, next to this bundle in out/. */
const RENDERER_DIR = join(__dirname, '../renderer');

function isInsideDir(filePath: string, dir: string): boolean {
  const rel = relative(dir, filePath);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/** True for a URL that is one of this app's own renderer pages. */
export function isAppUrl(
  url: string,
  devServerUrl: string | undefined = process.env.ELECTRON_RENDERER_URL,
  rendererDir: string = RENDERER_DIR,
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (devServerUrl) {
    return parsed.origin === new URL(devServerUrl).origin;
  }
  if (parsed.protocol !== 'file:') {
    return false;
  }
  return isInsideDir(fileURLToPath(parsed), rendererDir);
}

function isTrustedSender(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url;
  return url !== undefined && isAppUrl(url);
}

/** `ipcMain.handle` that refuses calls from any frame that is not the app's own page. */
export function handleTrusted(channel: string, listener: InvokeListener): void {
  ipcMain.handle(channel, (event, ...args: unknown[]) => {
    if (!isTrustedSender(event)) {
      throw new Error(`Refused IPC "${channel}" from an untrusted frame`);
    }
    return listener(event, ...args);
  });
}

/** `ipcMain.on` that silently drops messages from any frame that is not the app's own page. */
export function onTrusted(channel: string, listener: MessageListener): void {
  ipcMain.on(channel, (event, ...args: unknown[]) => {
    if (isTrustedSender(event)) {
      listener(event, ...args);
    }
  });
}

/**
 * Applied to every web contents the app creates: no new windows (the app opens none — links
 * to the portal go through `shell.openExternal` in main), and no navigation away from the
 * app's own pages.
 */
export function installNavigationGuards(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    const blockForeign = (event: Electron.Event, url: string): void => {
      if (!isAppUrl(url)) {
        event.preventDefault();
        console.warn(`Blocked navigation to ${url}`);
      }
    };
    contents.on('will-navigate', blockForeign);
    contents.on('will-redirect', blockForeign);
    contents.on('will-attach-webview', (event) => event.preventDefault());
  });
}

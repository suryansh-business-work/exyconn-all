import { afterEach, describe, expect, it, vi } from 'vitest';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Listener = (event: unknown, ...args: unknown[]) => unknown;

const handlers = new Map<string, Listener>();
const messages = new Map<string, Listener>();
const appListeners = new Map<string, Listener>();

vi.mock('electron', () => ({
  app: { on: (event: string, fn: Listener) => appListeners.set(event, fn) },
  ipcMain: {
    handle: (channel: string, fn: Listener) => handlers.set(channel, fn),
    on: (channel: string, fn: Listener) => messages.set(channel, fn),
  },
}));

import {
  handleTrusted,
  installNavigationGuards,
  isAppUrl,
  onTrusted,
} from '../../../src/main/web-security';

/** The built renderer folder the module derives from its own location (src/main/../renderer). */
const rendererPage = pathToFileURL(
  fileURLToPath(new URL('../../../src/renderer/index.html', import.meta.url)),
).href;
const DEV = 'http://localhost:4005';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('isAppUrl defaults', () => {
  it('reads the dev server from the environment when none is passed', () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', DEV);

    expect(isAppUrl(`${DEV}/index.html`)).toBe(true);
    expect(isAppUrl(rendererPage)).toBe(false);
  });

  it('falls back to the renderer folder next to the bundle in a packaged app', () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '');

    expect(isAppUrl(rendererPage)).toBe(true);
    // The folder itself is not a page.
    expect(isAppUrl(pathToFileURL(fileURLToPath(new URL('.', rendererPage))).href)).toBe(false);
  });
});

describe('handleTrusted', () => {
  it('answers a call from the app’s own page with the listener’s result', () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', DEV);
    const listener = vi.fn(
      (_event: unknown, a: unknown, b: unknown) => `${String(a)}-${String(b)}`,
    );
    handleTrusted('ok-channel', listener);

    const event = { senderFrame: { url: `${DEV}/` } };
    expect(handlers.get('ok-channel')?.(event, 'x', 'y')).toBe('x-y');
    expect(listener).toHaveBeenCalledWith(event, 'x', 'y');
  });
});

describe('onTrusted', () => {
  it('delivers messages from the app and silently drops the rest', () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', DEV);
    const listener = vi.fn();
    onTrusted('message-channel', listener);
    const deliver = messages.get('message-channel');

    deliver?.({ senderFrame: { url: 'https://evil.example/' } }, 'bad');
    deliver?.({ senderFrame: undefined }, 'none');
    expect(listener).not.toHaveBeenCalled();

    const event = { senderFrame: { url: `${DEV}/screenshots.html` } };
    deliver?.(event, 'good');
    expect(listener).toHaveBeenCalledWith(event, 'good');
  });
});

describe('installNavigationGuards', () => {
  function guardedContents() {
    const on = new Map<string, Listener>();
    let openHandler: (() => unknown) | undefined;
    const contents = {
      setWindowOpenHandler: (fn: () => unknown) => {
        openHandler = fn;
      },
      on: (event: string, fn: Listener) => on.set(event, fn),
    };
    installNavigationGuards();
    appListeners.get('web-contents-created')?.({}, contents);
    return { on, openWindow: () => openHandler?.() };
  }

  it('denies every new window', () => {
    const { openWindow } = guardedContents();

    expect(openWindow()).toEqual({ action: 'deny' });
  });

  it('blocks navigation and redirects off the app’s pages, and lets its own through', () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', DEV);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { on } = guardedContents();

    for (const name of ['will-navigate', 'will-redirect']) {
      const foreign = { preventDefault: vi.fn() };
      on.get(name)?.(foreign, 'https://evil.example/');
      expect(foreign.preventDefault).toHaveBeenCalled();

      const own = { preventDefault: vi.fn() };
      on.get(name)?.(own, `${DEV}/index.html`);
      expect(own.preventDefault).not.toHaveBeenCalled();
    }
    expect(warn).toHaveBeenCalledWith('Blocked navigation to https://evil.example/');
  });

  it('never attaches a webview', () => {
    const { on } = guardedContents();
    const event = { preventDefault: vi.fn() };

    on.get('will-attach-webview')?.(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });
});

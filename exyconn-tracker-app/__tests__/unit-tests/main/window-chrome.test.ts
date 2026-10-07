import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';
import { IPC } from '@shared/types';

type Handler = (event: unknown) => unknown;

const { handlers, fromWebContents } = vi.hoisted(() => ({
  handlers: new Map<string, Handler>(),
  fromWebContents: vi.fn(),
}));

vi.mock('electron', () => ({ BrowserWindow: { fromWebContents } }));
vi.mock('../../../src/main/web-security', () => ({
  handleTrusted: (channel: string, fn: Handler) => handlers.set(channel, fn),
}));

import { applyWindowChrome, registerWindowControls } from '../../../src/main/window-chrome';

const realPlatform = process.platform;

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true });
}

afterEach(() => {
  setPlatform(realPlatform);
  fromWebContents.mockReset();
});

/** A window that records calls and lets the test fire its events. */
function fakeWindow(options: { maximized?: boolean; destroyed?: boolean } = {}) {
  let maximized = options.maximized ?? false;
  const events = new Map<string, () => void>();
  const contentsEvents = new Map<string, () => void>();
  const win = {
    minimize: vi.fn(),
    close: vi.fn(),
    maximize: vi.fn(() => {
      maximized = true;
    }),
    unmaximize: vi.fn(() => {
      maximized = false;
    }),
    isMaximized: () => maximized,
    isDestroyed: () => options.destroyed ?? false,
    setIcon: vi.fn(),
    on: (event: string, fn: () => void) => events.set(event, fn),
    webContents: {
      send: vi.fn(),
      on: (event: string, fn: () => void) => contentsEvents.set(event, fn),
    },
  };
  return { win, events, contentsEvents };
}

describe('registerWindowControls', () => {
  registerWindowControls();
  const sender = { id: 1 };
  const call = (channel: string) => handlers.get(channel)?.({ sender });

  it('minimises and closes the window the message came from', () => {
    const { win } = fakeWindow();
    fromWebContents.mockReturnValue(win);

    call(IPC.minimizeWindow);
    call(IPC.closeWindow);

    expect(fromWebContents).toHaveBeenCalledWith(sender);
    expect(win.minimize).toHaveBeenCalled();
    expect(win.close).toHaveBeenCalled();
  });

  it('toggles maximise and answers with where the window ended up', () => {
    const { win } = fakeWindow();
    fromWebContents.mockReturnValue(win);

    expect(call(IPC.toggleMaximizeWindow)).toBe(true);
    expect(win.maximize).toHaveBeenCalled();
    expect(call(IPC.toggleMaximizeWindow)).toBe(false);
    expect(win.unmaximize).toHaveBeenCalled();
  });

  it('does nothing for a sender that no longer has a window', () => {
    fromWebContents.mockReturnValue(null);

    expect(call(IPC.minimizeWindow)).toBeUndefined();
    expect(call(IPC.closeWindow)).toBeUndefined();
    expect(call(IPC.toggleMaximizeWindow)).toBe(false);
  });
});

describe('applyWindowChrome', () => {
  it('reports every route to and from maximised, and the state once the page loads', () => {
    setPlatform('win32');
    const { win, events, contentsEvents } = fakeWindow({ maximized: true });
    applyWindowChrome(win as unknown as BrowserWindow);

    events.get('maximize')?.();
    events.get('unmaximize')?.();
    events.get('enter-full-screen')?.();
    events.get('leave-full-screen')?.();
    contentsEvents.get('did-finish-load')?.();

    expect(win.webContents.send.mock.calls).toEqual([
      [IPC.windowMaximized, true],
      [IPC.windowMaximized, false],
      [IPC.windowMaximized, true],
      [IPC.windowMaximized, false],
      [IPC.windowMaximized, true],
    ]);
    expect(win.setIcon).not.toHaveBeenCalled();
  });

  it('says nothing to a window that has been destroyed', () => {
    const { win, events } = fakeWindow({ destroyed: true });
    applyWindowChrome(win as unknown as BrowserWindow);

    events.get('maximize')?.();

    expect(win.webContents.send).not.toHaveBeenCalled();
  });

  it('gives the window its own icon on Linux, where nothing else would', () => {
    setPlatform('linux');
    const { win } = fakeWindow();

    applyWindowChrome(win as unknown as BrowserWindow);

    expect(win.setIcon).toHaveBeenCalledWith(expect.stringContaining('icon.png'));
  });
});

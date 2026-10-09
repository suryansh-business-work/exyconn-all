import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';

const { windows, applyWindowChrome, loadFails } = vi.hoisted(() => ({
  windows: [] as FakeWindow[],
  applyWindowChrome: vi.fn(),
  loadFails: { value: false },
}));

interface FakeWindow {
  options: Record<string, unknown>;
  events: Map<string, () => void>;
  destroyed: boolean;
  minimized: boolean;
  loadURL: ReturnType<typeof vi.fn>;
  loadFile: ReturnType<typeof vi.fn>;
  show: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

vi.mock('electron', () => ({
  BrowserWindow: class {
    options: Record<string, unknown>;
    events = new Map<string, () => void>();
    destroyed = false;
    minimized = false;
    loadURL = vi.fn(() =>
      loadFails.value ? Promise.reject(new Error('gone')) : Promise.resolve(),
    );
    loadFile = vi.fn(() =>
      loadFails.value ? Promise.reject(new Error('gone')) : Promise.resolve(),
    );
    show = vi.fn();
    focus = vi.fn();
    restore = vi.fn();
    close = vi.fn();
    constructor(options: Record<string, unknown>) {
      this.options = options;
      windows.push(this);
    }
    on(event: string, fn: () => void): void {
      this.events.set(event, fn);
    }
    isDestroyed(): boolean {
      return this.destroyed;
    }
    isMinimized(): boolean {
      return this.minimized;
    }
  },
}));
vi.mock('../../../src/main/window-chrome', () => ({ applyWindowChrome }));

const parent = { getBackgroundColor: () => '#111111' } as unknown as BrowserWindow;
const MONDAY = { startISO: '2026-09-14T00:00:00.000Z', endISO: '2026-09-15T00:00:00.000Z' };
const TUESDAY = { startISO: '2026-09-15T00:00:00.000Z', endISO: '2026-09-16T00:00:00.000Z' };

/** A fresh module per test: the open gallery is module state. */
async function gallery() {
  vi.resetModules();
  return import('../../../src/main/screenshots-window');
}

beforeEach(() => {
  windows.length = 0;
  loadFails.value = false;
  applyWindowChrome.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('openScreenshotsWindow', () => {
  it('opens a frameless, sandboxed peer window on the dev server for the day', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:4005');
    const { openScreenshotsWindow } = await gallery();

    openScreenshotsWindow(parent, MONDAY);

    const [win] = windows;
    expect(win.options).toMatchObject({ frame: false, show: false, backgroundColor: '#111111' });
    expect(win.options.webPreferences).toMatchObject({ contextIsolation: true, sandbox: true });
    const url = new URL(win.loadURL.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe('http://localhost:4005/screenshots.html');
    expect(url.searchParams.get('start')).toBe(MONDAY.startISO);
    expect(url.searchParams.get('end')).toBe(MONDAY.endISO);
    expect(applyWindowChrome).toHaveBeenCalledWith(win);

    win.events.get('ready-to-show')?.();
    expect(win.show).toHaveBeenCalled();
  });

  it('loads the built page with the day in its query in a packaged app', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '');
    const { openScreenshotsWindow } = await gallery();

    openScreenshotsWindow(parent, MONDAY);

    const [file, options] = windows[0].loadFile.mock.calls[0] as [string, unknown];
    expect(file.replaceAll('\\', '/')).toMatch(/renderer\/screenshots\.html$/);
    expect(options).toEqual({ query: { start: MONDAY.startISO, end: MONDAY.endISO } });
  });

  it('logs a page that fails to load, in dev and packaged alike', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    loadFails.value = true;
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:4005');
    const dev = await gallery();
    dev.openScreenshotsWindow(parent, MONDAY);
    vi.stubEnv('ELECTRON_RENDERER_URL', '');
    const packaged = await gallery();
    packaged.openScreenshotsWindow(parent, MONDAY);

    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(2));
    expect(error).toHaveBeenCalledWith('Screenshot gallery failed to load', expect.any(Error));
  });

  it('focuses the open gallery instead of stacking another, reloading only for a new day', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '');
    const { openScreenshotsWindow } = await gallery();
    openScreenshotsWindow(parent, MONDAY);
    const [win] = windows;

    openScreenshotsWindow(parent, MONDAY);
    expect(windows).toHaveLength(1);
    expect(win.loadFile).toHaveBeenCalledTimes(1);
    expect(win.focus).toHaveBeenCalledTimes(1);
    expect(win.restore).not.toHaveBeenCalled();

    win.minimized = true;
    openScreenshotsWindow(parent, TUESDAY);
    expect(win.loadFile).toHaveBeenCalledTimes(2);
    expect(win.restore).toHaveBeenCalled();
    expect(win.focus).toHaveBeenCalledTimes(2);
  });

  it('builds a new window once the old one is closed or destroyed', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '');
    const { openScreenshotsWindow } = await gallery();
    openScreenshotsWindow(parent, MONDAY);
    windows[0].events.get('closed')?.();

    openScreenshotsWindow(parent, MONDAY);
    expect(windows).toHaveLength(2);

    windows[1].destroyed = true;
    openScreenshotsWindow(parent, MONDAY);
    expect(windows).toHaveLength(3);
  });
});

describe('closeScreenshotsWindow', () => {
  it('closes the open gallery, and does nothing when there is none', async () => {
    vi.stubEnv('ELECTRON_RENDERER_URL', '');
    const { closeScreenshotsWindow, openScreenshotsWindow } = await gallery();

    expect(() => closeScreenshotsWindow()).not.toThrow();

    openScreenshotsWindow(parent, MONDAY);
    closeScreenshotsWindow();
    expect(windows[0].close).toHaveBeenCalledTimes(1);

    windows[0].destroyed = true;
    closeScreenshotsWindow();
    expect(windows[0].close).toHaveBeenCalledTimes(1);
  });
});

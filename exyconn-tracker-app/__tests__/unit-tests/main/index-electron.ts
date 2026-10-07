/**
 * Electron, as far as src/main/index.ts uses it: the app's lifecycle events, its windows, the
 * session's permission handler and the shell. Part of the index.*.test.ts harness.
 */
import { vi } from 'vitest';

type Fn = (...args: unknown[]) => unknown;

/** Every `app.on` listener, by event. */
export const appEvents = new Map<string, Fn>();

interface Gate {
  promise: Promise<void>;
  open: () => void;
}

export function gate(): Gate {
  let open: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

export const env = { lock: true, packaged: true, ready: gate() };

export class FakeWindow {
  static all: FakeWindow[] = [];
  readonly events = new Map<string, Fn>();
  readonly webContents = { send: vi.fn() };
  destroyed = false;
  visible = true;
  readonly show = vi.fn();
  readonly hide = vi.fn();
  readonly focus = vi.fn();
  readonly destroy = vi.fn(() => {
    this.destroyed = true;
  });
  readonly loadURL = vi.fn(() => Promise.resolve());
  readonly loadFile = vi.fn(() => Promise.resolve());
  constructor(readonly options: Record<string, unknown>) {
    FakeWindow.all.push(this);
  }
  on(event: string, fn: Fn): void {
    this.events.set(event, fn);
  }
  isDestroyed(): boolean {
    return this.destroyed;
  }
  isVisible(): boolean {
    return this.visible;
  }
  getBounds(): { x: number; y: number; width: number; height: number } {
    return { x: 10, y: 20, width: 500, height: 700 };
  }
}

export const electron = {
  app: {
    on: (event: string, fn: Fn) => appEvents.set(event, fn),
    requestSingleInstanceLock: () => env.lock,
    whenReady: () => env.ready.promise,
    quit: vi.fn(),
    setAppUserModelId: vi.fn(),
    getVersion: () => '1.10.6',
    get isPackaged(): boolean {
      return env.packaged;
    },
  },
  BrowserWindow: FakeWindow,
  session: { defaultSession: { setPermissionRequestHandler: vi.fn() } },
  shell: { openExternal: vi.fn(() => Promise.resolve()) },
};

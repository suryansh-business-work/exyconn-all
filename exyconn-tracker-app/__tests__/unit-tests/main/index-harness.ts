/**
 * Stand-ins for everything src/main/index.ts wires together, so the entry point can be loaded
 * in a test process. Each index.*.test.ts mocks the real modules with these objects (loaded
 * through `vi.hoisted`) and calls `launch` to run the entry point afresh.
 */
import { vi } from 'vitest';
import type { AppPreferences, TrackerState } from '@shared/types';
import { appEvents, env, FakeWindow, gate } from './index-electron';

export * from './index-electron';

type Fn = (...args: unknown[]) => unknown;

/** Every `handleTrusted` channel the entry point registered, by name. */
export const ipc = new Map<string, Fn>();
/** What the controller reports; tests change it to put the app in another state. */
export const world: { state: TrackerState } = { state: idleState() };

export function idleState(): TrackerState {
  return {
    status: 'idle',
    user: { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' },
    settings: { captureSoundEnabled: true },
    stats: { syncing: false, pendingSync: 0 },
  } as unknown as TrackerState;
}

/** The controller commands the IPC layer forwards; each resolves with its own name. */
export const COMMANDS = [
  'login',
  'logout',
  'acceptConsent',
  'markAttendance',
  'setProject',
  'setTask',
  'start',
  'pause',
  'resume',
  'stop',
  'getReport',
  'getDay',
  'getTotals',
  'setTimezone',
  'getTranslations',
  'translateMissing',
  'refreshPermissions',
  'requestPermission',
  'getTasks',
  'getManualEntries',
  'createManualEntry',
  'withdrawManualEntry',
  'setPresence',
  'getMessages',
  'sendMessage',
  'markMessagesRead',
  'restore',
  'syncNow',
] as const;

export const controller = {
  args: [] as unknown[],
  getState: vi.fn(() => world.state),
  setPreferences: vi.fn((update: Partial<AppPreferences>) => ({ ...store.preferences, ...update })),
  ...Object.fromEntries(COMMANDS.map((name) => [name, vi.fn(() => Promise.resolve(name))])),
} as Record<(typeof COMMANDS)[number], ReturnType<typeof vi.fn>> & {
  args: unknown[];
  getState: ReturnType<typeof vi.fn>;
  setPreferences: ReturnType<typeof vi.fn>;
};

export const tray = { args: [] as unknown[], update: vi.fn() };

export const updater = {
  onChange: (() => undefined) as (update: unknown) => void,
  installsAutomatically: false,
  current: { stage: 'idle' },
  start: vi.fn(),
  install: vi.fn(),
  setAutomatic: vi.fn(),
  checkNow: vi.fn(() => Promise.resolve()),
  download: vi.fn(),
};

export const store = {
  preferences: {} as AppPreferences,
};

export const mocks = {
  notifyScreenshotCaptured: vi.fn(),
  openScreenshotsWindow: vi.fn(),
  closeScreenshotsWindow: vi.fn(),
  composeWithWebcam: vi.fn(() => Promise.resolve('photo')),
  registerCaptureBridge: vi.fn(),
  applyWindowChrome: vi.fn(),
  registerWindowControls: vi.fn(),
  wantsTransparency: vi.fn((preferred: boolean) => preferred),
  windowGroundOptions: vi.fn(() => ({ backgroundColor: '#101010' })),
  holdForUpload: vi.fn(() => false),
  saveReportFile: vi.fn(() => Promise.resolve({ path: '/r.csv' })),
  installMainCrashHandlers: vi.fn(),
  installNavigationGuards: vi.fn(),
  setLogUser: vi.fn(),
  handleTrusted: (channel: string, fn: Fn) => ipc.set(channel, fn),
};

export function TrackerController(this: object, ...args: unknown[]): void {
  controller.args = args;
  Object.assign(this, controller);
}

export const TrackerTray = class {
  update = tray.update;
  constructor(...args: unknown[]) {
    tray.args = args;
  }
};

export function AppUpdater(onChange: (update: unknown) => void): typeof updater {
  updater.onChange = onChange;
  return updater;
}

/** Lets the startup promise chain, and anything it scheduled, run to the end. */
export async function flush(): Promise<void> {
  for (let pass = 0; pass < 5; pass += 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

/** Runs the entry point afresh. `ready: false` holds it before `app.whenReady` resolves. */
export async function launch(
  options: { lock?: boolean; packaged?: boolean; ready?: boolean } = {},
) {
  vi.clearAllMocks();
  ipc.clear();
  appEvents.clear();
  FakeWindow.all.length = 0;
  world.state = idleState();
  updater.installsAutomatically = false;
  store.preferences = {
    closeToTray: true,
    themeMode: 'system',
    muteCaptureSound: false,
    progressStyle: 'bar',
    updateAutomatically: true,
    transparentBackground: false,
    backgroundOpacity: 0.75,
  };
  env.lock = options.lock ?? true;
  env.packaged = options.packaged ?? true;
  env.ready = gate();
  vi.resetModules();
  await import('../../../src/main/index');
  if (options.ready !== false) {
    env.ready.open();
  }
  await flush();
}

/** The main window the entry point built most recently. */
export function mainWindow(): FakeWindow {
  const win = FakeWindow.all.at(-1);
  if (win === undefined) {
    throw new Error('No window was created');
  }
  return win;
}

/** Invokes one registered IPC channel the way a trusted renderer would. */
export function invoke(channel: string, ...args: unknown[]): unknown {
  const handler = ipc.get(channel);
  if (handler === undefined) {
    throw new Error(`No handler for ${channel}`);
  }
  return handler({}, ...args);
}

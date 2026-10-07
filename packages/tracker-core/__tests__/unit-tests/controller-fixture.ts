import { vi } from 'vitest';
import {
  TrackerController,
  type ControllerDeps,
  type TrackerState,
  type TrackerStore,
} from '../../src/controller';
import { TrackerEngine, type EngineHooks } from '../../src/engine';
import type { TrackerMeResponse } from '../../src/portal/client';
import type { TrackerSettings } from '../../src/types';
import { DEVICE, WORKDAY, loginResponse, me } from './controller-data';
import { enginePlatform, type EnginePlatform } from './engine-fixture';

export interface Prefs {
  theme: string;
}
export interface Perms {
  camera: boolean;
}
export type PermKind = 'camera' | 'screen';
export type Controller = TrackerController<Perms, Prefs, PermKind>;
export type State = TrackerState<Perms, Prefs>;
type Deps = ControllerDeps<Perms, Prefs, PermKind>;

/** An in-memory install store, as the desktop's file or the phone's secure store would be. */
export interface MemoryStore extends TrackerStore<Prefs> {
  token: string | null;
  remembered: boolean;
  preferences: Prefs;
  selectedProjectId: string;
  selectedTaskId: string;
}

export function memoryStore(token: string | null = null): MemoryStore {
  const store: MemoryStore = {
    token,
    remembered: token !== null,
    preferences: { theme: 'system' },
    selectedProjectId: '',
    selectedTaskId: '',
    getToken: vi.fn(() => store.token),
    setToken: vi.fn((next: string, remember: boolean) => {
      store.token = next;
      store.remembered = remember;
    }),
    clearToken: vi.fn(() => {
      store.token = null;
      store.remembered = false;
    }),
    setPreferences: vi.fn((update: Partial<Prefs>) => {
      store.preferences = { ...store.preferences, ...update };
      return store.preferences;
    }),
    setSelectedProject: vi.fn((projectId: string) => {
      store.selectedProjectId = projectId;
      store.selectedTaskId = '';
    }),
    setSelectedTask: vi.fn((taskId: string) => {
      store.selectedTaskId = taskId;
    }),
  };
  return store;
}

export interface Rig {
  controller: Controller;
  deps: Deps;
  portal: Deps['portal'];
  store: MemoryStore;
  /** The real engine's fakes, once the controller has built one. */
  platform: EnginePlatform;
  /** The hooks the controller handed its engine. */
  hooks(): EngineHooks;
  /** Every state pushed to the UI, newest last. */
  states: State[];
  latest(): State;
}

export function rig(token: string | null = null): Rig {
  const store = memoryStore(token);
  const platform = enginePlatform();
  const states: State[] = [];
  let engineHooks: EngineHooks | null = null;
  const portal: Deps['portal'] = {
    login: vi.fn(() => Promise.resolve(loginResponse())),
    fetchBranding: vi.fn(() => Promise.reject(new Error('no branding'))),
    trackerMe: vi.fn(() => Promise.resolve(me())),
    heartbeat: vi.fn(() => Promise.resolve(me())),
    fetchMyReport: vi.fn(() => Promise.resolve([])),
    fetchMyDay: vi.fn(),
    setTimezone: vi.fn((zone: string) => Promise.resolve(zone)),
    fetchMyTotals: vi.fn(),
    fetchTimezones: vi.fn(() => Promise.resolve(['UTC'])),
    fetchTranslations: vi.fn(() => Promise.resolve({})),
    translateMissing: vi.fn(() => Promise.resolve({})),
    acceptConsent: vi.fn(() => Promise.resolve()),
    markAttendance: vi.fn(() => Promise.resolve(WORKDAY)),
    fetchTasks: vi.fn(() => Promise.resolve([])),
    fetchManualEntries: vi.fn(() => Promise.resolve([])),
    createManualEntry: vi.fn(),
    withdrawManualEntry: vi.fn(() => Promise.resolve()),
    fetchMessages: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(),
    markMessagesRead: vi.fn(() => Promise.resolve(0)),
    setPresence: vi.fn((status, note) => Promise.resolve({ status, note, since: null })),
  };
  const deps: Deps = {
    portal,
    store: () => store,
    deviceInfo: () => DEVICE,
    notifier: { autoPaused: vi.fn(), autoStopped: vi.fn(), messages: vi.fn(), notice: vi.fn() },
    permissions: {
      get: vi.fn((webcamEnabled: boolean) => ({ camera: webcamEnabled })),
      request: vi.fn(() => Promise.resolve()),
    },
    createEngine: vi.fn((settings: TrackerSettings, hooks: EngineHooks) => {
      engineHooks = hooks;
      return new TrackerEngine(settings, hooks, platform.deps);
    }),
    onChange: vi.fn((state: State) => {
      states.push(state);
    }),
    onCapture: vi.fn(),
    composeWithWebcam: vi.fn(() => Promise.resolve('composited')),
  };
  return {
    controller: new TrackerController(deps),
    deps,
    portal,
    store,
    platform,
    states,
    hooks: () => {
      if (engineHooks === null) {
        throw new Error('No engine was built');
      }
      return engineHooks;
    },
    latest: () => {
      const last = states.at(-1);
      if (last === undefined) {
        throw new Error('Nothing was emitted');
      }
      return last;
    },
  };
}

/** A rig already signed in from a remembered session, with its first ticks settled. */
export async function signedIn(overrides: Partial<TrackerMeResponse> = {}): Promise<Rig> {
  const setup = rig(`device-${Date.now()}`);
  vi.mocked(setup.portal.trackerMe).mockResolvedValue(me(overrides));
  vi.mocked(setup.portal.heartbeat).mockResolvedValue(me(overrides));
  await setup.controller.restore();
  await vi.advanceTimersByTimeAsync(0);
  return setup;
}

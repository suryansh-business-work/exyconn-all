import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TrackerSettings, TrackerState } from '@shared/types';

const tempDir = mkdtempSync(join(tmpdir(), 'controller-'));

vi.mock('electron', () => ({
  app: { getPath: () => tempDir },
  powerMonitor: { getSystemIdleTime: () => 0 },
  systemPreferences: {},
  shell: { openExternal: () => Promise.resolve() },
}));

// macOS TCC status is a real system call; the sync path does not depend on it.
vi.mock('./trackers/permissions', () => ({
  getPermissions: () => ({ screenRecording: true, accessibility: true, allGranted: true }),
  requestPermission: () => Promise.resolve(),
}));
// The native input hook and screen capture cannot run in a test process.
vi.mock('./trackers/input-counter', () => ({
  InputCounter: class {
    start(): void {}
    stop(): void {}
    peek() {
      return { keys: 0, clicks: 0 };
    }
    drain() {
      return { keys: 0, clicks: 0 };
    }
  },
}));
vi.mock('./trackers/window-tracker', () => ({
  WindowTracker: class {
    sample(): Promise<string> {
      return Promise.resolve('Code');
    }
    drain(): unknown[] {
      return [];
    }
  },
}));
vi.mock('./trackers/screenshotter', () => ({
  Screenshotter: class {
    capture(): Promise<unknown[]> {
      return Promise.resolve([]);
    }
  },
}));
vi.mock('./device-info', () => ({ collectDeviceInfo: () => ({ deviceId: 'device-1' }) }));

// A signed-in app, without touching the OS keychain.
vi.mock('./store', () => ({
  secureStore: () => ({
    getToken: () => 'device-token',
    clearToken: vi.fn(),
    setToken: vi.fn(),
    remembered: true,
  }),
}));

vi.mock('./portal-client', async () => {
  const actual = await vi.importActual<typeof import('./portal-client')>('./portal-client');
  return {
    ...actual,
    fetchBranding: vi.fn(() => Promise.reject(new Error('no branding in tests'))),
    trackerMe: vi.fn(),
    heartbeat: vi.fn(),
  };
});

import { TrackerController } from './controller';
import * as portal from './portal-client';
import { TrackerAuthError } from './portal-client';

const SETTINGS: TrackerSettings = {
  intervalMinutes: 10,
  screenshotsPerInterval: 1,
  randomizeScreenshotTiming: true,
  blurScreenshots: false,
  trackWindowTitles: true,
  idleThresholdSeconds: 300,
  screenshotMaxWidth: 1600,
  screenshotQuality: 60,
  webcamEnabled: false,
  webcamCorner: 'bottom-right',
  autoSyncEnabled: true,
  syncIntervalMinutes: 5,
  consentText: '<p>Disclosure</p>',
};

function portalState(overrides: Partial<portal.TrackerMeResponse> = {}): portal.TrackerMeResponse {
  return {
    user: { id: 'u1', name: 'Emp', email: 'emp@exyconn.com' },
    consentRequired: false,
    settings: SETTINGS,
    timezone: 'Asia/Kolkata',
    ...overrides,
  };
}

/** A restored, signed-in controller plus the states it pushed to the renderer. */
async function signedInController() {
  const states: TrackerState[] = [];
  const controller = new TrackerController(
    (state) => states.push(state),
    () => undefined,
    () => Promise.resolve(null),
  );
  await controller.restore();
  return { controller, states };
}

describe('portal sync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState());
    vi.mocked(portal.heartbeat).mockResolvedValue(portalState());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('adopts settings an admin changed, without a restart', async () => {
    const { controller } = await signedInController();
    expect(controller.getState().settings?.intervalMinutes).toBe(10);

    vi.mocked(portal.heartbeat).mockResolvedValue(
      portalState({ settings: { ...SETTINGS, intervalMinutes: 3, blurScreenshots: true } }),
    );
    await vi.advanceTimersByTimeAsync(60_000);

    const settings = controller.getState().settings;
    expect(settings?.intervalMinutes).toBe(3);
    expect(settings?.blurScreenshots).toBe(true);
  });

  it('checks in with the portal on a timer, so "last seen" stays true', async () => {
    await signedInController();

    await vi.advanceTimersByTimeAsync(180_000);

    expect(vi.mocked(portal.heartbeat)).toHaveBeenCalledTimes(3);
  });

  it('does not re-render the UI when nothing changed', async () => {
    const { states } = await signedInController();
    const before = states.length;

    await vi.advanceTimersByTimeAsync(120_000);

    expect(states.length).toBe(before);
  });

  it('follows the portal into and out of the consent screen', async () => {
    vi.mocked(portal.trackerMe).mockResolvedValue(portalState({ consentRequired: true }));
    const { controller } = await signedInController();
    expect(controller.getState().status).toBe('consent-required');

    vi.mocked(portal.heartbeat).mockResolvedValue(portalState({ consentRequired: false }));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(controller.getState().status).toBe('idle');
  });

  it('signs out, with a reason, once access is revoked', async () => {
    const { controller } = await signedInController();

    vi.mocked(portal.heartbeat).mockRejectedValue(new TrackerAuthError('revoked'));
    await vi.advanceTimersByTimeAsync(60_000);

    const state = controller.getState();
    expect(state.status).toBe('signed-out');
    expect(state.signedOutReason).toMatch(/access was removed/i);
  });

  it('rides out a portal outage without disturbing the session', async () => {
    const { controller } = await signedInController();

    vi.mocked(portal.heartbeat).mockRejectedValueOnce(new TypeError('fetch failed'));
    await vi.advanceTimersByTimeAsync(60_000);

    expect(controller.getState().status).toBe('idle');
    expect(controller.getState().user?.email).toBe('emp@exyconn.com');
  });

  it('stops checking in after sign-out', async () => {
    const { controller } = await signedInController();
    await controller.logout();
    vi.mocked(portal.heartbeat).mockClear();

    await vi.advanceTimersByTimeAsync(180_000);

    expect(vi.mocked(portal.heartbeat)).not.toHaveBeenCalled();
  });
});

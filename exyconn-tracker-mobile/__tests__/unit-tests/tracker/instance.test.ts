import type { EngineHooks } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { announceCapture, composeWithWebcam } from '../../../src/tracker/capture';
import { notifyCaptureStopped } from '../../../src/tracker/notifier';
import { refreshPermissionSnapshot } from '../../../src/tracker/permissions';
import {
  getSnapshot,
  refreshPermissions,
  requestPermission,
  resumeTracking,
  subscribe,
  tracker,
} from '../../../src/tracker/instance';
import { settings } from '../dashboard/fixtures';
import { captureReport } from './capture-fixtures';
import { depsOf, stateOf, type ControllerDepsSeen } from './instance-fixtures';

const h = await vi.hoisted(async () => (await import('./instance-fixtures')).createHarness());
const native = vi.hoisted(() => ({
  hasScreenCapture: vi.fn(() => true),
  requestScreenCapture: vi.fn(() => Promise.resolve(true)),
  addListener: vi.fn(),
}));

vi.mock('@exyconn/tracker-core', () => ({
  TrackerController: function TrackerController(deps: unknown) {
    h.deps = deps as ControllerDepsSeen;
    return h.controller;
  },
  TrackerEngine: function TrackerEngine(...args: unknown[]) {
    h.engineArgs.push(args);
  },
}));
vi.mock('../../../src/native/tracker-native', () => ({ TrackerNative: native }));
vi.mock('../../../src/tracker/capture', () => ({
  announceCapture: vi.fn(),
  composeWithWebcam: vi.fn(),
}));
vi.mock('../../../src/tracker/device-info', () => ({
  deviceInfo: vi.fn(),
  loadDeviceInfo: vi.fn(),
}));
vi.mock('../../../src/tracker/notifier', () => ({
  configureNotifications: vi.fn(),
  mobileNotifier: { name: 'notifier' },
  notifyCaptureStopped: vi.fn(),
}));
vi.mock('../../../src/tracker/permissions', () => ({
  mobilePermissions: { name: 'permissions' },
  refreshPermissionSnapshot: vi.fn(),
}));
vi.mock('../../../src/tracker/platform', () => ({
  CAPTURE_DECLINED: 'Capture declined',
  portal: { name: 'portal' },
  createEngineDeps: vi.fn((context: unknown) => {
    Object.assign(h, { context });
    return { name: 'engine-deps' };
  }),
}));
vi.mock('../../../src/tracker/store', () => ({ mobileStore: vi.fn() }));

const hooks = { onStats: vi.fn() } as unknown as EngineHooks;

function context() {
  if (h.context === null) {
    throw new Error('No engine has been created.');
  }
  return h.context;
}

describe('before the first state is published', () => {
  it('wires one controller to the phone’s portal, notifier, permissions and camera', () => {
    expect(tracker).toBe(h.controller);
    expect(depsOf(h)).toMatchObject({
      portal: { name: 'portal' },
      notifier: { name: 'notifier' },
      permissions: { name: 'permissions' },
    });
    expect(depsOf(h).composeWithWebcam).toBe(composeWithWebcam);
    expect(getSnapshot()).toBeNull();
  });

  it('builds an engine on the settings it is given, and announces captures audibly', () => {
    const given = settings({ intervalMinutes: 15 });
    depsOf(h).createEngine(given, hooks);
    expect(h.engineArgs.at(-1)).toEqual([given, hooks, { name: 'engine-deps' }]);
    expect(context().settings()).toBe(given);
    context().onCaptureLost();
    expect(tracker.pause).not.toHaveBeenCalled();
    const report = captureReport();
    depsOf(h).onCapture(report);
    expect(announceCapture).toHaveBeenCalledWith(report, null, false);
  });
});

describe('publishing state', () => {
  it('stores each state and tells every subscriber until it unsubscribes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    const state = stateOf('idle');
    depsOf(h).onChange(state);
    expect(getSnapshot()).toBe(state);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    depsOf(h).onChange(stateOf('idle'));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('runs the engine on the settings in force now, and honours this phone’s mute', () => {
    const current = settings({ intervalMinutes: 5 });
    depsOf(h).onChange(stateOf('tracking', { settings: current, muted: true }));
    depsOf(h).createEngine(settings(), hooks);
    expect(context().settings()).toBe(current);
    const report = captureReport();
    depsOf(h).onCapture(report);
    expect(announceCapture).toHaveBeenCalledWith(report, current, true);
  });

  it('pauses and says why when screen capture ends under a running session', () => {
    depsOf(h).onChange(stateOf('tracking'));
    context().onCaptureLost();
    expect(tracker.pause).toHaveBeenCalledTimes(1);
    expect(notifyCaptureStopped).toHaveBeenCalledTimes(1);
  });

  it('ignores a lost capture when nothing is being tracked', () => {
    depsOf(h).onChange(stateOf('paused'));
    context().onCaptureLost();
    expect(tracker.pause).not.toHaveBeenCalled();
    expect(notifyCaptureStopped).not.toHaveBeenCalled();
  });
});

describe('permissions', () => {
  it('re-reads the OS grants and republishes', async () => {
    const fresh = stateOf('idle');
    h.controller.getState.mockReturnValue(fresh);
    await refreshPermissions();
    expect(refreshPermissionSnapshot).toHaveBeenCalledTimes(1);
    expect(tracker.refreshPermissions).toHaveBeenCalledTimes(1);
    expect(getSnapshot()).toBe(fresh);
  });

  it('asks for one grant, then shows the answer', async () => {
    h.controller.getState.mockReturnValue(stateOf('idle'));
    await requestPermission('camera');
    expect(tracker.requestPermission).toHaveBeenCalledWith('camera');
    expect(refreshPermissionSnapshot).toHaveBeenCalledTimes(1);
  });
});

describe('resumeTracking', () => {
  it('asks for screen capture again when the grant it paused over has gone', async () => {
    depsOf(h).onChange(stateOf('paused', { settings: settings({ screenshotsPerInterval: 2 }) }));
    native.hasScreenCapture.mockReturnValue(false);
    await resumeTracking();
    expect(native.requestScreenCapture).toHaveBeenCalledTimes(1);
    expect(tracker.resume).toHaveBeenCalledTimes(1);
  });

  it('stays paused, and says why, when capture is declined again', async () => {
    depsOf(h).onChange(stateOf('paused', { settings: settings({ screenshotsPerInterval: 2 }) }));
    native.hasScreenCapture.mockReturnValue(false);
    native.requestScreenCapture.mockResolvedValue(false);
    await expect(resumeTracking()).rejects.toThrow('Capture declined');
    expect(tracker.resume).not.toHaveBeenCalled();
  });

  it('resumes straight away while the capture session is still live', async () => {
    depsOf(h).onChange(stateOf('paused', { settings: settings({ screenshotsPerInterval: 2 }) }));
    await resumeTracking();
    expect(native.requestScreenCapture).not.toHaveBeenCalled();
    expect(tracker.resume).toHaveBeenCalledTimes(1);
  });

  it('needs no capture when the workspace takes no screenshots, or has not loaded', async () => {
    depsOf(h).onChange(stateOf('paused', { settings: settings({ screenshotsPerInterval: 0 }) }));
    await resumeTracking();
    depsOf(h).onChange(stateOf('paused', { settings: null }));
    await resumeTracking();
    expect(native.hasScreenCapture).not.toHaveBeenCalled();
    expect(tracker.resume).toHaveBeenCalledTimes(2);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { bootTracker, resumeTracking, tracker } from '../../../src/tracker/instance';
import { depsOf, stateOf, type ControllerDepsSeen } from './instance-fixtures';
import { settings } from '../dashboard/fixtures';

const h = await vi.hoisted(async () => (await import('./instance-fixtures')).createHarness());

vi.mock('@exyconn/tracker-core', () => ({
  TrackerController: class {
    constructor(deps: unknown) {
      h.deps = deps as ControllerDepsSeen;
      return h.controller;
    }
  },
  TrackerEngine: class {},
}));
vi.mock('../../../src/tracker/capture', () => ({ composeWithWebcam: vi.fn() }));
vi.mock('../../../src/tracker/device-info', () => ({
  deviceInfo: vi.fn(),
  loadDeviceInfo: vi.fn(),
}));
vi.mock('../../../src/tracker/notifier', () => ({
  configureNotifications: vi.fn(),
  mobileNotifier: {},
}));
vi.mock('../../../src/tracker/permissions', () => ({
  mobilePermissions: {},
  refreshPermissionSnapshot: vi.fn(),
}));
vi.mock('../../../src/tracker/platform', () => ({
  CAPTURE_DECLINED: 'Capture declined',
  portal: {},
}));
vi.mock('../../../src/tracker/store', () => ({ mobileStore: vi.fn() }));

/** iOS: no native module — nothing to re-grant, and no capture session to listen to. */
describe('the tracker on an iPhone', () => {
  it('resumes without asking for screen capture, whatever the workspace takes', async () => {
    depsOf(h).onChange(stateOf('paused', { settings: settings({ screenshotsPerInterval: 2 }) }));
    await resumeTracking();
    expect(tracker.resume).toHaveBeenCalledTimes(1);
  });

  it('boots without a capture-session listener', async () => {
    await expect(bootTracker()).resolves.toBeUndefined();
    expect(tracker.restore).toHaveBeenCalledTimes(1);
  });
});

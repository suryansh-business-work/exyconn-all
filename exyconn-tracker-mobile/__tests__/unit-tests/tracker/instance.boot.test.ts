import { describe, expect, it, vi } from 'vitest';
import { loadDeviceInfo } from '../../../src/tracker/device-info';
import { configureNotifications, notifyCaptureStopped } from '../../../src/tracker/notifier';
import { refreshPermissionSnapshot } from '../../../src/tracker/permissions';
import { bootTracker, tracker } from '../../../src/tracker/instance';
import { rnTest } from '../mocks/react-native/apis';
import { depsOf, stateOf, type ControllerDepsSeen } from './instance-fixtures';

const h = await vi.hoisted(async () => (await import('./instance-fixtures')).createHarness());
const native = vi.hoisted(() => ({ addListener: vi.fn() }));

vi.mock('@exyconn/tracker-core', () => ({
  TrackerController: class {
    constructor(deps: unknown) {
      h.deps = deps as ControllerDepsSeen;
      return h.controller;
    }
  },
  TrackerEngine: class {},
}));
vi.mock('../../../src/native/tracker-native', () => ({ TrackerNative: native }));
vi.mock('../../../src/tracker/capture', () => ({ composeWithWebcam: vi.fn() }));
vi.mock('../../../src/tracker/device-info', () => ({
  deviceInfo: vi.fn(),
  loadDeviceInfo: vi.fn(),
}));
vi.mock('../../../src/tracker/notifier', () => ({
  configureNotifications: vi.fn(),
  mobileNotifier: {},
  notifyCaptureStopped: vi.fn(),
}));
vi.mock('../../../src/tracker/permissions', () => ({
  mobilePermissions: {},
  refreshPermissionSnapshot: vi.fn(),
}));
vi.mock('../../../src/tracker/platform', () => ({ CAPTURE_DECLINED: 'declined', portal: {} }));
vi.mock('../../../src/tracker/store', () => ({ mobileStore: vi.fn() }));

/** Lets the boot sequence's awaits and a fire-and-forget refresh run to completion. */
async function flush(): Promise<void> {
  for (let step = 0; step < 10; step += 1) {
    await Promise.resolve();
  }
}

describe('bootTracker', () => {
  it('starts once: notifications, device facts, grants, listeners, then the saved session', async () => {
    const order: string[] = [];
    vi.mocked(configureNotifications).mockImplementation(() => {
      order.push('notifications');
      return Promise.resolve();
    });
    vi.mocked(loadDeviceInfo).mockImplementation(() => {
      order.push('device');
      return Promise.resolve();
    });
    vi.mocked(refreshPermissionSnapshot).mockImplementation(() => {
      order.push('grants');
      return Promise.resolve();
    });
    h.controller.restore.mockImplementation(() => {
      order.push('restore');
      return Promise.resolve();
    });

    const first = bootTracker();
    expect(bootTracker()).toBe(first);
    await first;
    expect(order).toEqual(['notifications', 'device', 'grants', 'restore']);
    expect(native.addListener).toHaveBeenCalledWith('onScreenCaptureStopped', expect.any(Function));
    expect(rnTest.listenerCount('appState', 'change')).toBe(1);

    // Coming back from Settings re-reads the grants; going away does not.
    h.controller.getState.mockReturnValue(stateOf('idle'));
    rnTest.appState('background');
    await flush();
    expect(tracker.refreshPermissions).not.toHaveBeenCalled();
    rnTest.appState('active');
    await vi.waitFor(() => expect(tracker.refreshPermissions).toHaveBeenCalledTimes(1));

    // A refresh that fails is logged, never thrown into the OS event.
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('permissions unavailable');
    vi.mocked(refreshPermissionSnapshot).mockRejectedValueOnce(cause);
    rnTest.appState('active');
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith('Refreshing permissions failed', cause),
    );
    error.mockRestore();

    // The system "Stop sharing" chip pauses a running session.
    const [, onStopped] = native.addListener.mock.calls[0] as [string, () => void];
    depsOf(h).onChange(stateOf('tracking'));
    onStopped();
    expect(tracker.pause).toHaveBeenCalledTimes(1);
    expect(notifyCaptureStopped).toHaveBeenCalledTimes(1);
  });
});

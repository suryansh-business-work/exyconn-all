import type { TrackerSettings } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { releaseKeepAlive } from '../../../../src/tracker/keep-alive';
import { cameraGranted } from '../../../../src/tracker/permissions';
import { CAPTURE_DECLINED, androidDeps } from '../../../../src/tracker/platform/android';
import { fakeContext, fakeNative } from './android-fixtures';

vi.mock('../../../../src/tracker/platform/shared', () => ({
  baseDeps: () => ({ portal: 'portal', outbox: 'outbox', input: 'input' }),
}));
vi.mock('../../../../src/tracker/keep-alive', () => ({ releaseKeepAlive: vi.fn() }));
vi.mock('../../../../src/tracker/permissions', () => ({ cameraGranted: vi.fn() }));

const KEEP_ALIVE = {
  title: 'Exyconn Tracker is tracking',
  body: 'Your work time is being recorded. Tap to open the tracker.',
};

function sessionOf(
  native: ReturnType<typeof fakeNative>['native'],
  overrides: Partial<TrackerSettings> = {},
) {
  const session = androidDeps(native, fakeContext(overrides).context).session;
  if (session === undefined) {
    throw new Error('Android sessions are bracketed.');
  }
  return session;
}

describe('beginning a session', () => {
  it('starts the foreground service, holding the camera when photos are on and granted', async () => {
    vi.mocked(cameraGranted).mockReturnValue(true);
    const { spies, native } = fakeNative();
    await sessionOf(native, { webcamEnabled: true, screenshotsPerInterval: 0 }).begin();
    expect(spies.startKeepAlive).toHaveBeenCalledWith({ ...KEEP_ALIVE, camera: true });
    expect(spies.requestScreenCapture).not.toHaveBeenCalled();
  });

  it('leaves the camera alone when photos are off or the grant is missing', async () => {
    const { spies, native } = fakeNative();
    vi.mocked(cameraGranted).mockReturnValue(true);
    await sessionOf(native, { webcamEnabled: false, screenshotsPerInterval: 0 }).begin();
    vi.mocked(cameraGranted).mockReturnValue(false);
    await sessionOf(native, { webcamEnabled: true, screenshotsPerInterval: 0 }).begin();
    const cameras = spies.startKeepAlive.mock.calls.map(([options]) => options);
    expect(cameras).toEqual([
      { ...KEEP_ALIVE, camera: false },
      { ...KEEP_ALIVE, camera: false },
    ]);
  });

  it('asks for screen capture when the workspace takes screenshots', async () => {
    const { spies, native } = fakeNative();
    await sessionOf(native, { screenshotsPerInterval: 2 }).begin();
    expect(spies.requestScreenCapture).toHaveBeenCalledTimes(1);
    expect(spies.stopKeepAlive).not.toHaveBeenCalled();
    expect(releaseKeepAlive).not.toHaveBeenCalled();
  });

  it('refuses the session, and stops the service, when capture is declined', async () => {
    const { spies, native } = fakeNative();
    spies.requestScreenCapture.mockResolvedValue(false);
    await expect(sessionOf(native, { screenshotsPerInterval: 2 }).begin()).rejects.toThrow(
      CAPTURE_DECLINED,
    );
    expect(releaseKeepAlive).toHaveBeenCalledTimes(1);
    expect(spies.stopKeepAlive).toHaveBeenCalledTimes(1);
  });
});

describe('ending a session', () => {
  it('releases the capture grant and the keep-alive task, then stops the service', async () => {
    const { spies, native } = fakeNative();
    await sessionOf(native).end();
    expect(spies.releaseScreenCapture).toHaveBeenCalledTimes(1);
    expect(releaseKeepAlive).toHaveBeenCalledTimes(1);
    expect(spies.stopKeepAlive).toHaveBeenCalledTimes(1);
  });
});

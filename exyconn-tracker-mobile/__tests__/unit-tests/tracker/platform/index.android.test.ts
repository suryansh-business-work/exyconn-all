import { describe, expect, it, vi } from 'vitest';
import { capabilities, createEngineDeps } from '../../../../src/tracker/platform';
import { androidDeps } from '../../../../src/tracker/platform/android';
import { fakeContext } from './android-fixtures';

const native = vi.hoisted(() => ({ getIdleSeconds: () => 0 }));

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<{ Platform: Record<string, unknown> }>();
  return { ...actual, Platform: { ...actual.Platform, OS: 'android' } };
});
vi.mock('../../../../src/native/tracker-native', () => ({
  TrackerNative: native,
  KEEP_ALIVE_TASK: 'ExyconnTrackerKeepAlive',
}));
vi.mock('../../../../src/tracker/platform/shared', () => ({ portal: { name: 'portal' } }));
vi.mock('../../../../src/tracker/platform/android', () => ({
  androidDeps: vi.fn(() => ({ name: 'android-deps' })),
  CAPTURE_DECLINED: 'declined',
  lastCaptureDimensions: () => ({ width: 0, height: 0 }),
}));

describe('the Android platform', () => {
  it('observes screenshots, the app in front, the camera and the background', () => {
    expect(capabilities).toEqual({
      screenshots: true,
      foregroundApp: true,
      inputCounts: false,
      webcam: true,
      background: true,
    });
  });

  it('builds the engine on the native module', () => {
    const { context } = fakeContext();
    expect(createEngineDeps(context)).toEqual({ name: 'android-deps' });
    expect(androidDeps).toHaveBeenCalledWith(native, context);
  });
});

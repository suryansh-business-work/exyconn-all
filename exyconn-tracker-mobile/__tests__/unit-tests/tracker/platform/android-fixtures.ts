import { vi } from 'vitest';
import type { androidDeps } from '../../../../src/tracker/platform/android';
import type { PlatformContext } from '../../../../src/tracker/platform/shared';
import { settings } from '../../dashboard/fixtures';

export type Native = Parameters<typeof androidDeps>[0];

/** The Kotlin module's surface as spies, each answering as a granted, working phone would. */
export function fakeNative() {
  const spies = {
    getIdleSeconds: vi.fn(() => 12),
    hasUsageAccess: vi.fn(() => true),
    openUsageAccessSettings: vi.fn(),
    getForegroundApp: vi.fn((): { packageName: string; label: string } | null => null),
    requestScreenCapture: vi.fn(() => Promise.resolve(true)),
    hasScreenCapture: vi.fn(() => true),
    releaseScreenCapture: vi.fn(),
    captureScreen: vi.fn(() =>
      Promise.resolve<{ base64: string; mimeType: string; width: number; height: number } | null>({
        base64: 'shot-base64',
        mimeType: 'image/jpeg',
        width: 1080,
        height: 2400,
      }),
    ),
    takeWebcamPhoto: vi.fn(() => Promise.resolve(null)),
    composeWebcam: vi.fn(() => Promise.resolve('')),
    startKeepAlive: vi.fn((_options: unknown) => Promise.resolve()),
    stopKeepAlive: vi.fn(() => Promise.resolve()),
    showCaptureNotification: vi.fn(),
    addListener: vi.fn(() => ({ remove: vi.fn() })),
  };
  return { spies, native: spies as unknown as Native };
}

/** What the running app tells the adapter: the settings in force and the capture-lost hook. */
export function fakeContext(overrides: Parameters<typeof settings>[0] = {}) {
  const onCaptureLost = vi.fn();
  const context: PlatformContext = { settings: () => settings(overrides), onCaptureLost };
  return { context, onCaptureLost };
}

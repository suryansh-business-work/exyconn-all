import { vi } from 'vitest';

/**
 * `expo`: no native module is linked under test, so `TrackerNative` is null (iOS behaviour).
 * To test the Android path, mock this before importing the code that reads it:
 * `vi.mocked(requireOptionalNativeModule).mockReturnValue(fakeModule)` + `vi.resetModules()`,
 * or `vi.mock('../../../src/native/tracker-native', () => ({ TrackerNative: fake, ... }))`.
 */
export const requireOptionalNativeModule = vi.fn((_name: string): unknown => null);
export const requireNativeModule = vi.fn((name: string): unknown => {
  throw new Error(`Native module ${name} is not available under test.`);
});
export const registerRootComponent = vi.fn();

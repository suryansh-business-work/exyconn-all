import { afterEach, vi } from 'vitest';
import { fileSystemTest } from '../mocks/expo-file-system';
import { secureStoreTest } from '../mocks/expo-secure-store';
import { webViewTest } from '../mocks/react-native-webview';
import { rnTest } from '../mocks/react-native/apis';

/**
 * Runs before every test file, node and jsdom alike. React Native's `__DEV__` global is true,
 * as in a dev build; a test of the release path sets it to false and restores it.
 */
Object.assign(globalThis, { __DEV__: true });

/**
 * Each test starts from the stubs' defaults: every spy back to the implementation it was
 * created with (vitest's mockReset), and the in-memory disk, keychain and native events empty.
 */
afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
  Object.assign(globalThis, { __DEV__: true });
  rnTest.reset();
  fileSystemTest.clear();
  secureStoreTest.clear();
  webViewTest.clear();
});

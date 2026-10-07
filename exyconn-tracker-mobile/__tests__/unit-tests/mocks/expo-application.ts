import { vi } from 'vitest';

/**
 * `expo-application`. To change the version, mock the module in the test:
 * `vi.mock('expo-application', async (load) => ({ ...(await load()), nativeApplicationVersion: '2.0.0' }))`.
 */
export const nativeApplicationVersion: string | null = '1.0.0';
export const nativeBuildVersion: string | null = '1';
export const applicationId = 'com.exyconn.tracker';
export const getAndroidId = vi.fn(() => 'android-id');
export const getIosIdForVendorAsync = vi.fn((): Promise<string | null> =>
  Promise.resolve('ios-id'),
);

import { vi } from 'vitest';

/** `expo-notifications`: permission granted, scheduling succeeds, no tapped notification. */
export const AndroidImportance = { DEFAULT: 3, HIGH: 4, MAX: 5 } as const;
export const setNotificationHandler = vi.fn();
export const setNotificationChannelAsync = vi.fn(() => Promise.resolve(null));
export const scheduleNotificationAsync = vi.fn((_request: unknown) =>
  Promise.resolve('notification-id'),
);
export const getPermissionsAsync = vi.fn(() =>
  Promise.resolve({ granted: true, status: 'granted' }),
);
export const requestPermissionsAsync = vi.fn(() =>
  Promise.resolve({ granted: true, status: 'granted' }),
);
export const useLastNotificationResponse = vi.fn((): unknown => null);
export const clearLastNotificationResponse = vi.fn();

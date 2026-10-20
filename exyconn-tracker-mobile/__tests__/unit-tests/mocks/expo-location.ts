import { vi } from 'vitest';

/** `expo-location`: foreground access granted and one fixed fix, unless a test mocks otherwise. */
export const Accuracy = { Lowest: 1, Low: 2, Balanced: 3, High: 4, Highest: 5 } as const;

export const requestForegroundPermissionsAsync = vi.fn(() =>
  Promise.resolve({ granted: true, status: 'granted' }),
);

/** Arbitrary test coordinates; `timestamp` is epoch milliseconds, as the native module sends. */
export const getCurrentPositionAsync = vi.fn((_options?: unknown) =>
  Promise.resolve({
    coords: { latitude: 12.97, longitude: 77.59, accuracy: 12 as number | null },
    timestamp: Date.UTC(2026, 8, 11, 4, 0, 0),
  }),
);

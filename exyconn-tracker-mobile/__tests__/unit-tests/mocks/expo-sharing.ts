import { vi } from 'vitest';

/** `expo-sharing`: sharing is available and succeeds unless a test mocks otherwise. */
export const isAvailableAsync = vi.fn(() => Promise.resolve(true));
export const shareAsync = vi.fn((_uri: string, _options?: unknown) => Promise.resolve());

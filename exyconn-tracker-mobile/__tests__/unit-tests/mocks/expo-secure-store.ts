import { vi } from 'vitest';

/** `expo-secure-store`: an in-memory keychain; `secureStoreTest.clear()` empties it. */
const items = new Map<string, string>();

export const getItem = vi.fn((key: string) => items.get(key) ?? null);
export const setItem = vi.fn((key: string, value: string) => {
  items.set(key, value);
});
export const getItemAsync = vi.fn((key: string) => Promise.resolve(items.get(key) ?? null));
export const setItemAsync = vi.fn((key: string, value: string) => {
  items.set(key, value);
  return Promise.resolve();
});
export const deleteItemAsync = vi.fn((key: string) => {
  items.delete(key);
  return Promise.resolve();
});

export const secureStoreTest = { clear: () => items.clear(), items };

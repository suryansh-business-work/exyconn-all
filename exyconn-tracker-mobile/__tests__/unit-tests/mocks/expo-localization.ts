import { vi } from 'vitest';

/** `expo-localization`: an English phone in UTC unless a test says otherwise. */
export const getLocales = vi.fn(() => [{ languageTag: 'en-US', languageCode: 'en' }]);
export const getCalendars = vi.fn((): { timeZone: string | null }[] => [{ timeZone: 'UTC' }]);

import { vi } from 'vitest';

/** `expo-font`: fonts are loaded; `mockReturnValue([false, error])` simulates a failure. */
export const useFonts = vi.fn((_fonts: unknown): [boolean, Error | null] => [true, null]);

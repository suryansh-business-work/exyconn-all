import { vi } from 'vitest';

/**
 * jsdom has no `matchMedia`, so MUI's `useMediaQuery` answers false for every query. This makes
 * it answer `matching(query)` instead. Undo with `vi.unstubAllGlobals()`.
 */
export function stubMatchMedia(matching: (query: string) => boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matching(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/** A phone-width screen: the `breakpoints.down('md')` query matches. */
export const PHONE_WIDTH = (query: string): boolean => query.includes('max-width');

/** The viewer asked their system for less motion. */
export const REDUCED_MOTION = (query: string): boolean =>
  query === '(prefers-reduced-motion: reduce)';

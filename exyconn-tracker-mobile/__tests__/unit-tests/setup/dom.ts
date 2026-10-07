import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/** jsdom lacks the layout APIs Tamagui's web build reads; these report a phone-sized window. */
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })),
});

class NoopObserver {
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn(() => []);
}

Object.assign(globalThis, {
  ResizeObserver: globalThis.ResizeObserver ?? NoopObserver,
  IntersectionObserver: globalThis.IntersectionObserver ?? NoopObserver,
});

afterEach(() => {
  cleanup();
});

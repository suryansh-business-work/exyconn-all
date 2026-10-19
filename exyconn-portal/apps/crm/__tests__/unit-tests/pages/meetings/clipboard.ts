import { vi } from 'vitest';

const original = Object.getOwnPropertyDescriptor(globalThis.navigator, 'clipboard');

/** Gives jsdom a clipboard whose `writeText` resolves; returns the spy to assert on. */
export function installClipboard() {
  const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

/** Puts jsdom's own clipboard (none) back after a test. */
export function restoreClipboard() {
  if (original) {
    Object.defineProperty(globalThis.navigator, 'clipboard', original);
  } else {
    Reflect.deleteProperty(globalThis.navigator, 'clipboard');
  }
}

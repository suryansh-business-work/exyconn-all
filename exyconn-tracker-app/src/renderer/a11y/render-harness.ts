import type { ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'vitest';
import type { TrackerState } from '@shared/types';
import { installTracker } from './tracker-fixture';

/**
 * Mounts whole renderer screens in jsdom against the mocked `window.tracker`, for the tests
 * that check the rendered document rather than a single component (axe, focus order).
 */

let root: Root | null = null;

/** jsdom implements none of these; the screens only need them to exist. */
export function installDomShims(): void {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Element.prototype.scrollIntoView = () => undefined;
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}

export function unmount(): void {
  act(() => root?.unmount());
  root = null;
}

/** Unmounts and clears the document between tests. */
export function cleanup(): void {
  unmount();
  document.body.innerHTML = '';
}

/** Lets every mocked IPC promise, and the render it triggers, settle. */
export async function settle(): Promise<void> {
  for (let pass = 0; pass < 5; pass += 1) {
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  }
}

export async function mount(element: ReactElement, state: TrackerState): Promise<void> {
  installTracker(state);
  const container = document.createElement('div');
  container.id = 'root';
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(element));
  await settle();
}

/** Clicks the first match and settles; returns it so a test can check focus comes back. */
export async function click(selector: string): Promise<HTMLElement | null> {
  const target = document.querySelector<HTMLElement>(selector);
  expect(target, selector).not.toBeNull();
  target?.focus();
  await act(async () => target?.click());
  await settle();
  return target;
}

/** Presses a key on whatever has focus, the way a keyboard user would. */
export async function press(key: string): Promise<void> {
  const target = document.activeElement ?? document.body;
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
  await settle();
}

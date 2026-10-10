import type { ReactElement } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'vitest';
import { settle } from './render-harness';

/**
 * Helpers for tests of one component's loading and error states: render it against a
 * `window.tracker` the test hands it (or override chosen commands of the fixture bridge), hold a
 * command in flight, and read what the screen shows meanwhile.
 */

type TrackerApi = Window['tracker'];
type Command = (...args: never[]) => Promise<unknown>;

let root: Root | null = null;

/** Installs the given stand-in as `window.tracker`. */
export function stubTracker(api: Partial<Window['tracker']>): void {
  Object.defineProperty(globalThis, 'tracker', { value: api, configurable: true, writable: true });
}

export async function render(element: ReactElement): Promise<void> {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(element));
}

/** Re-renders the mounted root with new props. */
export async function rerender(element: ReactElement): Promise<void> {
  await act(async () => root?.render(element));
}

/** Lets pending promises, and the render they trigger, settle. */
export async function flush(): Promise<void> {
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
}

export function unmountAll(): void {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = '';
}

/** The first button whose text or label contains `name`. */
export function button(name: string): HTMLButtonElement {
  const match = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (node) =>
      node.textContent.includes(name) || (node.getAttribute('aria-label') ?? '').includes(name),
  );
  if (match === undefined) {
    throw new Error(`No button named "${name}"`);
  }
  return match;
}

/** Clicks and settles. */
export async function click(target: HTMLElement): Promise<void> {
  await act(async () => target.click());
  await flush();
}

export interface Deferred<T = void> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (cause: unknown) => void;
}

/** A promise the test settles by hand — the window in which a loader must be showing. */
export function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/**
 * Puts chosen commands in front of the fake bridge `installTracker` set up, so a test can make
 * one of them hang (to see its loader) or fail (to see its error). Everything else still
 * answers from the fixture.
 */
export function overrideTracker(overrides: Partial<Record<keyof TrackerApi, Command>>): void {
  const base = globalThis.tracker;
  const api = new Proxy(
    {},
    {
      get(_target, name: string) {
        return overrides[name as keyof TrackerApi] ?? base[name as keyof TrackerApi];
      },
    },
  );
  Object.defineProperty(globalThis, 'tracker', { value: api, configurable: true, writable: true });
}

/** The first button whose text is exactly `label`. */
export function buttonNamed(label: string): HTMLButtonElement {
  const found = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === label,
  );
  expect(found, label).toBeDefined();
  return found as HTMLButtonElement;
}

/** Clicks `button` without waiting for what it started — the loader is what is under test. */
export async function press(button: HTMLElement): Promise<void> {
  await act(async () => button.click());
}

/** Settles `pending` one way or the other, then lets the render it causes land. */
export async function finish(run: () => void): Promise<void> {
  await act(async () => run());
  await settle();
}

/** Whether MUI is showing its loading spinner on this button. */
export function isLoading(button: HTMLElement): boolean {
  return button.classList.contains('MuiButton-loading');
}

/** The text of the error alert on screen, or undefined when there is none. */
export function errorText(): string | undefined {
  return document.querySelector('.MuiAlert-colorError')?.textContent ?? undefined;
}

/** Opens the MUI select labelled `label` and picks the option reading `option`. */
export async function choose(label: string, option: string): Promise<void> {
  const field = [...document.querySelectorAll<HTMLElement>('[role="combobox"]')].find((box) =>
    box
      .getAttribute('aria-labelledby')
      ?.split(' ')
      .some((id) => {
        return document.getElementById(id)?.textContent === label;
      }),
  );
  expect(field, label).toBeDefined();
  await act(async () => {
    field?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
  });
  const item = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (entry) => entry.textContent === option,
  );
  expect(item, option).toBeDefined();
  await act(async () => item?.click());
}

/** Types into a React-controlled input the way a keystroke would, so `onChange` fires. */
export async function typeInto(input: HTMLInputElement, value: string): Promise<void> {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

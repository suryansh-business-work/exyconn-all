// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import usePendingAction, { type PendingAction } from './usePendingAction';
import { deferred, render, unmountAll } from '../a11y/component-harness';

let latest: PendingAction<'save'> | null = null;

function Probe(): ReactElement {
  latest = usePendingAction<'save'>();
  return <span />;
}

function current(): PendingAction<'save'> {
  if (latest === null) {
    throw new Error('Probe not rendered');
  }
  return latest;
}

afterEach(() => {
  unmountAll();
  latest = null;
  vi.restoreAllMocks();
});

describe('usePendingAction', () => {
  it('marks the action pending while it runs, and refuses a second one meanwhile', async () => {
    await render(<Probe />);
    const held = deferred<void>();
    let first: Promise<boolean> = Promise.resolve(false);
    act(() => {
      first = current().perform('save', () => held.promise, 'fallback');
    });
    expect(current().pending).toBe('save');
    await expect(current().perform('save', () => Promise.resolve(), 'fallback')).resolves.toBe(
      false,
    );
    await act(async () => {
      held.resolve();
      await expect(first).resolves.toBe(true);
    });
    expect(current().pending).toBeNull();
    expect(current().error).toBeNull();
  });

  it('shows and logs a failure, then clears it on request', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await render(<Probe />);
    let ok = true;
    await act(async () => {
      ok = await current().perform('save', () => Promise.reject(new Error('Offline')), 'fallback');
    });
    expect(ok).toBe(false);
    expect(current().error).toBe('Offline');
    expect(log).toHaveBeenCalled();
    act(() => current().clearError());
    expect(current().error).toBeNull();
  });
});

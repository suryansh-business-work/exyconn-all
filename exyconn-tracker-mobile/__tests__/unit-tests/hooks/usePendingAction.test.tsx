import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePendingAction } from '../../../src/hooks/usePendingAction';
import { deferred } from './deferred';

const FALLBACK = 'Could not start tracking.';

describe('usePendingAction', () => {
  it('marks the running action, then resolves true when it succeeds', async () => {
    const work = deferred<undefined>();
    const { result } = renderHook(() => usePendingAction<'start' | 'stop'>());
    let outcome: Promise<boolean> = Promise.resolve(false);
    act(() => {
      outcome = result.current.perform('start', () => work.promise, FALLBACK);
    });
    expect(result.current.pending).toBe('start');
    await act(async () => {
      work.resolve(undefined);
      await expect(outcome).resolves.toBe(true);
    });
    expect(result.current.pending).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("shows and logs a failure in the error's own words", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('Attendance not marked');
    const { result } = renderHook(() => usePendingAction());
    let ok = true;
    await act(async () => {
      ok = await result.current.perform('start', () => Promise.reject(cause), FALLBACK);
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Attendance not marked');
    expect(result.current.pending).toBeNull();
    expect(error).toHaveBeenCalledWith('Action "start" failed', cause);
  });

  it('falls back to the plain sentence when the failure has no words of its own', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => usePendingAction());
    await act(async () => {
      await result.current.perform('start', () => Promise.reject(new Error('')), FALLBACK);
    });
    expect(result.current.error).toBe(FALLBACK);
  });

  it('refuses a second action while one is still running', async () => {
    const work = deferred<undefined>();
    const second = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => usePendingAction());
    let first: Promise<boolean> = Promise.resolve(false);
    let again: Promise<boolean> = Promise.resolve(true);
    act(() => {
      first = result.current.perform('start', () => work.promise, FALLBACK);
      again = result.current.perform('stop', second, FALLBACK);
    });
    await expect(again).resolves.toBe(false);
    expect(second).not.toHaveBeenCalled();
    await act(async () => {
      work.resolve(undefined);
      await first;
    });
    expect(result.current.pending).toBeNull();
  });

  it('clears the shown error on request, and when the next action starts', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => usePendingAction());
    await act(async () => {
      await result.current.perform('start', () => Promise.reject(new Error('No')), FALLBACK);
    });
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
    await act(async () => {
      await result.current.perform('start', () => Promise.reject(new Error('No')), FALLBACK);
    });
    expect(result.current.error).toBe('No');
    await act(async () => {
      await result.current.perform('start', () => Promise.resolve(), FALLBACK);
    });
    expect(result.current.error).toBeNull();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

const KEY = 'sig-test';
const INITIAL = { name: '' };

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('useLocalStorage', () => {
  it('starts from the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    expect(result.current[0]).toEqual(INITIAL);
  });

  it('starts from the stored value', () => {
    localStorage.setItem(KEY, JSON.stringify({ name: 'Ada' }));
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    expect(result.current[0]).toEqual({ name: 'Ada' });
  });

  it('falls back to the initial value when the stored JSON is corrupt', () => {
    localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    expect(result.current[0]).toEqual(INITIAL);
    expect(console.warn).toHaveBeenCalled();
  });

  it('stores a new value and an updater result', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    act(() => result.current[1]({ name: 'Grace' }));
    expect(result.current[0]).toEqual({ name: 'Grace' });
    expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual({ name: 'Grace' });

    act(() => result.current[1]((prev) => ({ name: `${prev.name} Hopper` })));
    expect(result.current[0]).toEqual({ name: 'Grace Hopper' });
    expect(JSON.parse(localStorage.getItem(KEY) as string)).toEqual({ name: 'Grace Hopper' });
  });

  it('keeps the in-memory value out of storage when writing fails', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    act(() => result.current[1]({ name: 'Too big' }));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('setting localStorage key'), expect.any(Error));
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('clears the stored value and goes back to the initial value', () => {
    localStorage.setItem(KEY, JSON.stringify({ name: 'Ada' }));
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    act(() => result.current[2]());
    expect(result.current[0]).toEqual(INITIAL);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('reports a failure to clear', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    act(() => result.current[2]());
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('clearing localStorage key'), expect.any(Error));
  });

  it('follows changes made by another tab for its own key only', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    act(() => {
      globalThis.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: JSON.stringify({ name: 'Remote' }) }));
    });
    expect(result.current[0]).toEqual({ name: 'Remote' });

    act(() => {
      globalThis.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: JSON.stringify({ name: 'No' }) }));
      globalThis.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: null }));
    });
    expect(result.current[0]).toEqual({ name: 'Remote' });
  });

  it('ignores a corrupt value written by another tab', () => {
    const { result } = renderHook(() => useLocalStorage(KEY, INITIAL));
    act(() => {
      globalThis.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '{broken' }));
    });
    expect(result.current[0]).toEqual(INITIAL);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('parsing localStorage change'),
      expect.any(Error)
    );
  });

  it('stops listening after unmount', () => {
    const remove = vi.spyOn(globalThis, 'removeEventListener');
    const { unmount } = renderHook(() => useLocalStorage(KEY, INITIAL));
    unmount();
    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});

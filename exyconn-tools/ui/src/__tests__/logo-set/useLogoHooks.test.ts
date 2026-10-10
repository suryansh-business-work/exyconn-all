import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from '../../tools/logo-set/hooks/useLocalStorage';
import useImageHistory from '../../tools/logo-set/hooks/useImageHistory';
import { MAX_HISTORY_STEPS } from '../../tools/logo-set/types';

const STATE_KEY = 'logo-set-state';
const HISTORY_KEY = 'logoset-image-history';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('useLocalStorage', () => {
  it('becomes loaded after mount and returns the default state when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage());
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.loadState()).toEqual({
      image: null,
      globalSettings: null,
      sizeSettings: {},
      croppedImages: {},
      format: 'png',
      customSizes: [],
    });
  });

  it('merges partial saves into what is already stored and loads them back', () => {
    const { result } = renderHook(() => useLocalStorage());
    act(() => result.current.saveState({ image: 'data:a', format: 'webp' }));
    act(() => result.current.saveState({ format: 'jpg' }));
    expect(JSON.parse(localStorage.getItem(STATE_KEY) as string)).toMatchObject({ image: 'data:a', format: 'jpg' });
    expect(result.current.loadState()).toMatchObject({ image: 'data:a', format: 'jpg', customSizes: [] });
  });

  it('clears the stored state', () => {
    const { result } = renderHook(() => useLocalStorage());
    act(() => result.current.saveState({ image: 'data:a' }));
    act(() => result.current.clearState());
    expect(localStorage.getItem(STATE_KEY)).toBeNull();
  });

  it('logs and survives corrupt or unwritable storage', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useLocalStorage());

    localStorage.setItem(STATE_KEY, '{broken');
    expect(result.current.loadState().image).toBeNull();
    act(() => result.current.saveState({ image: 'x' }));

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    act(() => result.current.clearState());

    expect(error).toHaveBeenCalledWith('Failed to load state:', expect.any(Error));
    expect(error).toHaveBeenCalledWith('Failed to save state:', expect.any(Error));
    expect(error).toHaveBeenCalledWith('Failed to clear state:', expect.any(Error));
  });
});

describe('useImageHistory', () => {
  it('restores a saved history and points at its last entry', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([
        { image: 'a', timestamp: 1 },
        { image: 'b', timestamp: 2 },
      ])
    );
    const { result } = renderHook(() => useImageHistory());
    expect(result.current.imageHistory.map((entry) => entry.image)).toEqual(['a', 'b']);
    expect(result.current.historyIndex).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('keeps the index at -1 for an empty saved history, and logs a corrupt one', () => {
    localStorage.setItem(HISTORY_KEY, '[]');
    expect(renderHook(() => useImageHistory()).result.current.historyIndex).toBe(-1);

    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem(HISTORY_KEY, 'not json');
    renderHook(() => useImageHistory());
    expect(error).toHaveBeenCalledWith('Failed to load history:', expect.any(SyntaxError));
  });

  it('adds, persists, undoes and redoes images', () => {
    const { result } = renderHook(() => useImageHistory());
    expect(result.current.undo()).toBeNull();
    expect(result.current.redo()).toBeNull();

    act(() => result.current.addToHistory('one'));
    act(() => result.current.addToHistory('two'));
    expect(result.current.historyIndex).toBe(1);
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY) as string).map((e: { image: string }) => e.image)).toEqual([
      'one',
      'two',
    ]);

    let undone: string | null = null;
    act(() => {
      undone = result.current.undo();
    });
    expect(undone).toBe('one');
    expect(result.current.canRedo).toBe(true);

    let redone: string | null = null;
    act(() => {
      redone = result.current.redo();
    });
    expect(redone).toBe('two');
  });

  it('skips the history entry that follows an undo, then resumes recording', () => {
    const { result } = renderHook(() => useImageHistory());
    act(() => result.current.addToHistory('one'));
    act(() => result.current.addToHistory('two'));
    act(() => {
      result.current.undo();
    });
    act(() => result.current.addToHistory('one-again'));
    expect(result.current.imageHistory).toHaveLength(2);
    act(() => result.current.addToHistory('three'));
    expect(result.current.imageHistory.map((entry) => entry.image)).toEqual(['one', 'three']);
  });

  it('drops the oldest step beyond the maximum', () => {
    const { result } = renderHook(() => useImageHistory());
    for (let i = 0; i < MAX_HISTORY_STEPS + 2; i += 1) {
      act(() => result.current.addToHistory(`img-${i}`));
    }
    expect(result.current.imageHistory).toHaveLength(MAX_HISTORY_STEPS);
    expect(result.current.imageHistory[0].image).toBe('img-2');
    expect(result.current.historyIndex).toBe(MAX_HISTORY_STEPS - 1);
  });

  it('clears the history and its storage', () => {
    const { result } = renderHook(() => useImageHistory());
    act(() => result.current.addToHistory('one'));
    act(() => result.current.clearHistory());
    expect(result.current.imageHistory).toEqual([]);
    expect(result.current.historyIndex).toBe(-1);
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('logs when the history cannot be written', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => useImageHistory());
    act(() => result.current.addToHistory('one'));
    expect(error).toHaveBeenCalledWith('Failed to save history:', expect.any(Error));
  });
});

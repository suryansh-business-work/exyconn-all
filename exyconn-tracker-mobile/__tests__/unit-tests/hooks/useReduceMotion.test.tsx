import { act, renderHook, waitFor } from '@testing-library/react';
import { AccessibilityInfo } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { useReduceMotion } from '../../../src/hooks/useReduceMotion';
import { rnTest } from '../mocks/react-native/apis';
import { deferred } from './deferred';

describe('useReduceMotion', () => {
  it('reads the phone setting when it mounts', async () => {
    vi.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(true);
    const { result } = renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('follows the setting while the app runs', async () => {
    const { result } = renderHook(() => useReduceMotion());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => rnTest.accessibility('reduceMotionChanged', true));
    expect(result.current).toBe(true);
    act(() => rnTest.accessibility('reduceMotionChanged', false));
    expect(result.current).toBe(false);
  });

  it('logs a setting it could not read and keeps the motion on', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('unavailable');
    vi.mocked(AccessibilityInfo.isReduceMotionEnabled).mockRejectedValue(cause);
    const { result } = renderHook(() => useReduceMotion());
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith('Reading the reduce-motion setting failed', cause),
    );
    expect(result.current).toBe(false);
  });

  it('stops listening, and ignores a late answer, once unmounted', async () => {
    const answer = deferred<boolean>();
    vi.mocked(AccessibilityInfo.isReduceMotionEnabled).mockReturnValue(answer.promise);
    const { result, unmount } = renderHook(() => useReduceMotion());
    expect(rnTest.listenerCount('accessibility', 'reduceMotionChanged')).toBe(1);
    unmount();
    expect(rnTest.listenerCount('accessibility', 'reduceMotionChanged')).toBe(0);
    await act(async () => {
      answer.resolve(true);
      await answer.promise;
    });
    expect(result.current).toBe(false);
  });
});

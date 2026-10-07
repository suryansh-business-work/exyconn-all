import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReload } from '../../../src/hooks/useReload';

describe('useReload', () => {
  it('starts on attempt 0, which is a first load rather than a reload', () => {
    const { result } = renderHook(() => useReload());
    expect(result.current.attempt).toBe(0);
    expect(result.current.isReload(0)).toBe(false);
  });

  it('bumps the attempt on reload, and reports it as a reload exactly once', () => {
    const { result } = renderHook(() => useReload());
    act(() => result.current.reload());
    expect(result.current.attempt).toBe(1);
    expect(result.current.isReload(1)).toBe(true);
    // The same attempt seen again (new arguments, same attempt) loads afresh.
    expect(result.current.isReload(1)).toBe(false);
  });

  it('keeps reload and isReload stable, so query effects do not re-run on every render', () => {
    const { result, rerender } = renderHook(() => useReload());
    const { reload, isReload } = result.current;
    rerender();
    act(() => result.current.reload());
    expect(result.current.reload).toBe(reload);
    expect(result.current.isReload).toBe(isReload);
  });
});

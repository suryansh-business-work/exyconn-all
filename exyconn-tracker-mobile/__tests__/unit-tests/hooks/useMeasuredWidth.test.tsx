import { act, renderHook } from '@testing-library/react';
import type { LayoutChangeEvent } from 'react-native';
import { describe, expect, it } from 'vitest';
import { useMeasuredWidth } from '../../../src/hooks/useMeasuredWidth';

function layoutOf(width: number): LayoutChangeEvent {
  return {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 10 } },
  } as unknown as LayoutChangeEvent;
}

describe('useMeasuredWidth', () => {
  it('is 0 until the view has been laid out', () => {
    const { result } = renderHook(() => useMeasuredWidth());
    expect(result.current[0]).toBe(0);
  });

  it('takes the laid-out width, rounded to a whole point', () => {
    const { result } = renderHook(() => useMeasuredWidth());
    act(() => result.current[1](layoutOf(320.6)));
    expect(result.current[0]).toBe(321);
    act(() => result.current[1](layoutOf(199.2)));
    expect(result.current[0]).toBe(199);
  });

  it('hands out the same layout handler on every render', () => {
    const { result, rerender } = renderHook(() => useMeasuredWidth());
    const handler = result.current[1];
    rerender();
    expect(result.current[1]).toBe(handler);
  });
});

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSearchArea } from '../../../../src/pages/lead-generator/useSearchArea';
import { corners } from './search-area-fake';

function drawn(count: number) {
  const hook = renderHook(() => useSearchArea());
  act(() => hook.result.current.start());
  for (const point of corners(count)) {
    act(() => hook.result.current.addPoint(point));
  }
  return hook;
}

describe('useSearchArea', () => {
  it('starts with no area and not drawing', () => {
    const { result } = renderHook(() => useSearchArea());

    expect(result.current).toMatchObject({ points: [], drawing: false, finished: false, area: [] });
  });

  it('collects corners while drawing but offers no area until it is finished', () => {
    const { result } = drawn(3);

    expect(result.current.drawing).toBe(true);
    expect(result.current.points).toEqual(corners(3));
    expect(result.current.finished).toBe(false);
    expect(result.current.area).toEqual([]);

    act(() => result.current.finish());
    expect(result.current.finished).toBe(true);
    expect(result.current.area).toEqual(corners(3));
  });

  it('keeps the same area between renders until the corners change', () => {
    const { result, rerender } = drawn(3);
    act(() => result.current.finish());
    const area = result.current.area;

    rerender();

    expect(result.current.area).toBe(area);
  });

  it('does not count a finished outline with too few corners as an area', () => {
    const { result } = drawn(2);

    act(() => result.current.finish());

    expect(result.current.finished).toBe(false);
    expect(result.current.area).toEqual([]);
  });

  it('stops adding corners at the limit of 50', () => {
    const { result } = drawn(50);

    act(() => result.current.addPoint({ lat: 0, lng: 0 }));

    expect(result.current.points).toHaveLength(50);
    expect(result.current.points.at(-1)).toEqual(corners(50)[49]);
  });

  it('undoes the last corner', () => {
    const { result } = drawn(3);

    act(() => result.current.undo());

    expect(result.current.points).toEqual(corners(2));
  });

  it('starts over from nothing when drawing again', () => {
    const { result } = drawn(3);
    act(() => result.current.finish());

    act(() => result.current.start());

    expect(result.current.points).toEqual([]);
    expect(result.current.drawing).toBe(true);
  });

  it('clears the area and stops drawing', () => {
    const { result } = drawn(3);

    act(() => result.current.clear());

    expect(result.current).toMatchObject({ points: [], drawing: false, area: [] });
  });

  it('takes the corners back after one is dragged', () => {
    const { result } = drawn(3);
    act(() => result.current.finish());
    const moved = corners(4);

    act(() => result.current.edit(moved));

    expect(result.current.area).toEqual(moved);
  });
});

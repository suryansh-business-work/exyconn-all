import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLeadSelection } from '../../../../src/pages/lead-generator/useLeadSelection';
import type { LeadPlace } from '../../../../src/pages/lead-generator/leadTypes';
import { leadPlace } from './lead-fixtures';

const a = leadPlace({ placeId: 'a' });
const b = leadPlace({ placeId: 'b' });

describe('useLeadSelection', () => {
  it('ticks and unticks one row at a time', () => {
    const { result } = renderHook(() => useLeadSelection([a, b]));

    act(() => result.current.toggle('a'));
    expect(result.current.selected).toEqual([a]);
    expect(result.current.ids.has('a')).toBe(true);

    act(() => result.current.toggle('a'));
    expect(result.current.selected).toEqual([]);
  });

  it('selects every row, then clears them all when every row is already ticked', () => {
    const { result } = renderHook(() => useLeadSelection([a, b]));

    act(() => result.current.toggle('a'));
    act(() => result.current.toggleAll());
    expect(result.current.selected).toEqual([a, b]);

    act(() => result.current.toggleAll());
    expect(result.current.selected).toEqual([]);
  });

  it('drops rows a new search no longer lists, and clears on request', () => {
    const { result, rerender } = renderHook(
      ({ places }: { places: LeadPlace[] }) => useLeadSelection(places),
      { initialProps: { places: [a, b] } },
    );
    act(() => result.current.toggleAll());

    rerender({ places: [b] });
    expect(result.current.selected).toEqual([b]);

    act(() => result.current.clear());
    expect(result.current.selected).toEqual([]);
    expect(result.current.ids.size).toBe(0);
  });
});

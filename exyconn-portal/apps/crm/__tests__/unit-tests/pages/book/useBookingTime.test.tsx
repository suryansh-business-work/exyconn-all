import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { browserZone, useBookingTime } from '../../../../src/pages/book/useBookingTime';
import { createWrapper } from '../../test-utils';

const moment = '2026-10-21T16:30:00.000Z';

function renderTime(zone: string) {
  return renderHook(({ current }: { current: string }) => useBookingTime(current), {
    initialProps: { current: zone },
    wrapper: createWrapper(),
  });
}

describe('browserZone', () => {
  it('is the zone the browser reports', () => {
    expect(browserZone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});

describe('useBookingTime', () => {
  it('writes times and dates in the portal formats, in the zone picked', () => {
    const { result } = renderTime('Asia/Tokyo');

    expect(result.current.time(moment)).toBe('01:30 AM');
    expect(result.current.date(moment)).toBe('22 Oct 2026');
    expect(result.current.dayKey(new Date(moment))).toBe('2026-10-22');
  });

  it('puts the same moment on another day in another zone', () => {
    const { result } = renderTime('America/New_York');

    expect(result.current.time(moment)).toBe('12:30 PM');
    expect(result.current.dayKey(moment)).toBe('2026-10-21');
  });

  it('titles a calendar day with its weekday and date in the visitor’s language', () => {
    const { result } = renderTime('UTC');

    expect(result.current.dayTitle(new Date(2026, 9, 21))).toBe('Wednesday, October 21');
  });

  it('keeps the same helpers until the zone changes', () => {
    const { result, rerender } = renderTime('UTC');
    const first = result.current;

    rerender({ current: 'UTC' });
    expect(result.current).toBe(first);

    rerender({ current: 'Asia/Tokyo' });
    expect(result.current).not.toBe(first);
  });
});

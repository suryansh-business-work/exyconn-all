import { describe, expect, it } from 'vitest';
import {
  adjacentDay,
  firstParam,
  galleryColumns,
  galleryRoute,
  hasNextDay,
  resolveGalleryDay,
  stepIndex,
} from '../../../src/lib/screenshots/gallery-day';

const KOLKATA = 'Asia/Kolkata';
/** 3 Feb 2026 in Kolkata (UTC+05:30), midnight to midnight. */
const FEB_3 = { startISO: '2026-02-02T18:30:00.000Z', endISO: '2026-02-03T18:30:00.000Z' };

describe('resolveGalleryDay', () => {
  it('uses explicit bounds as they were handed over', () => {
    expect(resolveGalleryDay({ start: FEB_3.startISO, end: FEB_3.endISO }, KOLKATA)).toEqual(FEB_3);
  });

  it('resolves a capture instant to its day IN THE ZONE, not the phone’s', () => {
    // 00:30 on 4 Feb in Kolkata is still 3 Feb in UTC — the gallery must open on the 4th.
    const range = resolveGalleryDay({ capturedAt: '2026-02-03T19:00:00.000Z' }, KOLKATA);
    expect(range).toEqual({
      startISO: '2026-02-03T18:30:00.000Z',
      endISO: '2026-02-04T18:30:00.000Z',
    });
  });

  it('prefers bounds over a capture instant — day navigation writes bounds', () => {
    const range = resolveGalleryDay(
      { capturedAt: '2026-02-10T06:00:00.000Z', start: FEB_3.startISO, end: FEB_3.endISO },
      KOLKATA,
    );
    expect(range).toEqual(FEB_3);
  });

  it('declines a link that names no day, or an unreadable one', () => {
    expect(resolveGalleryDay({}, KOLKATA)).toBeNull();
    expect(resolveGalleryDay({ capturedAt: 'not a date' }, KOLKATA)).toBeNull();
    expect(resolveGalleryDay({ start: FEB_3.endISO, end: FEB_3.startISO }, KOLKATA)).toBeNull();
  });

  it('reads the first of a repeated param', () => {
    expect(firstParam(['a', 'b'])).toBe('a');
    expect(firstParam(undefined)).toBe('');
  });
});

describe('adjacentDay', () => {
  it('steps one day either way in the zone', () => {
    expect(adjacentDay(FEB_3, 'next', KOLKATA)).toEqual({
      startISO: '2026-02-03T18:30:00.000Z',
      endISO: '2026-02-04T18:30:00.000Z',
    });
    expect(adjacentDay(FEB_3, 'previous', KOLKATA)).toEqual({
      startISO: '2026-02-01T18:30:00.000Z',
      endISO: '2026-02-02T18:30:00.000Z',
    });
  });

  it('only pages forward into a day that has begun', () => {
    expect(hasNextDay(FEB_3, new Date('2026-02-03T12:00:00.000Z'))).toBe(false);
    expect(hasNextDay(FEB_3, new Date('2026-02-03T18:30:00.000Z'))).toBe(true);
  });

  it('routes to the gallery with the bounds as params', () => {
    expect(galleryRoute(FEB_3)).toEqual({
      pathname: '/screenshots',
      params: { start: FEB_3.startISO, end: FEB_3.endISO },
    });
  });
});

describe('paging and layout', () => {
  it('wraps at both ends of the day', () => {
    expect(stepIndex(0, -1, 5)).toBe(4);
    expect(stepIndex(4, 1, 5)).toBe(0);
    expect(stepIndex(2, 1, 5)).toBe(3);
    expect(stepIndex(0, 1, 0)).toBe(0);
  });

  it('keeps a shot about 300px wide — one column on a phone', () => {
    expect(galleryColumns(360)).toBe(1);
    expect(galleryColumns(700)).toBe(2);
    expect(galleryColumns(100)).toBe(1);
  });
});

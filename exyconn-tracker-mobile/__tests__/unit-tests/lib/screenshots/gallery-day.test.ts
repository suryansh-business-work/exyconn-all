import { describe, expect, it } from 'vitest';
import { firstParam, resolveGalleryDay } from '../../../../src/lib/screenshots/gallery-day';

describe('gallery route params', () => {
  it('reads an empty repeated param as absent', () => {
    expect(firstParam([])).toBe('');
    expect(firstParam('2026-02-03')).toBe('2026-02-03');
  });

  it('ignores unreadable bounds and falls back to the capture instant', () => {
    const range = resolveGalleryDay(
      { start: 'yesterday', end: '2026-02-04T00:00:00.000Z', capturedAt: '2026-02-03T12:00:00Z' },
      'UTC',
    );
    expect(range).toEqual({
      startISO: '2026-02-03T00:00:00.000Z',
      endISO: '2026-02-04T00:00:00.000Z',
    });
  });

  it('ignores a readable start with an unreadable end', () => {
    expect(
      resolveGalleryDay({ start: '2026-02-03T00:00:00.000Z', end: 'later' }, 'UTC'),
    ).toBeNull();
  });
});

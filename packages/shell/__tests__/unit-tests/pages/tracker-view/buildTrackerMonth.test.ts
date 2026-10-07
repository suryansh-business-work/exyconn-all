import { describe, expect, it } from 'vitest';
import { buildTrackerMonth } from '@/pages/tracker-view/buildTrackerMonth';
import { makeBucket } from './fixtures';

describe('buildTrackerMonth', () => {
  // February 2026 starts on a Sunday and ends on a Saturday: exactly four whole weeks.
  it('covers whole Sunday-first weeks, and nothing more when the month fits them', () => {
    const cells = buildTrackerMonth(new Date(2026, 1, 1), [], new Date(2026, 1, 10));

    expect(cells).toHaveLength(28);
    expect(cells[0].dateKey).toBe('2026-02-01');
    expect(cells[27].dateKey).toBe('2026-02-28');
    expect(cells.every((cell) => cell.inMonth)).toBe(true);
  });

  it('pads with the neighbouring months and marks those days as outside it', () => {
    // March 2026 starts on a Sunday too, but ends on a Tuesday.
    const cells = buildTrackerMonth(new Date(2026, 2, 15), [], new Date(2000, 0, 1));

    expect(cells).toHaveLength(35);
    expect(cells.at(-1)?.dateKey).toBe('2026-04-04');
    expect(cells.filter((cell) => !cell.inMonth).map((cell) => cell.dateKey)).toEqual([
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
      '2026-04-04',
    ]);
    expect(cells.some((cell) => cell.isToday)).toBe(false);
  });

  it("overlays each day's bucket by date key and flags today", () => {
    const bucket = makeBucket({ date: '2026-02-10', activeMs: 1 });
    const cells = buildTrackerMonth(new Date(2026, 1, 1), [bucket], new Date(2026, 1, 10, 15));

    const tenth = cells.find((cell) => cell.dateKey === '2026-02-10');
    expect(tenth?.bucket).toBe(bucket);
    expect(tenth?.isToday).toBe(true);
    expect(cells.filter((cell) => cell.bucket)).toHaveLength(1);
    expect(cells.filter((cell) => cell.isToday)).toHaveLength(1);
  });
});

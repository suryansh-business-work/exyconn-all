import { describe, expect, it } from 'vitest';
import type { ReportDay } from '@exyconn/tracker-core';
import {
  buildMonthGrid,
  dateKey,
  trackedDateKeys,
  weekdayLabels,
} from '../../../src/lib/report/calendar';

const FEB_2026 = new Date(2026, 1, 1);

const reportDay = (date: string, activeMs: number): ReportDay => ({
  date,
  activeMs,
  idleMs: 0,
  keyCount: 0,
  mouseCount: 0,
  sessions: 1,
});

function grid(tracked: ReadonlySet<string> = new Set()) {
  return buildMonthGrid(FEB_2026, {
    tracked,
    selected: new Date(2026, 1, 10),
    maxDate: new Date(2026, 1, 12),
  });
}

describe('dateKey', () => {
  it('writes a local calendar date as the portal keys its days', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('trackedDateKeys', () => {
  it('keeps only the days with time on them', () => {
    const keys = trackedDateKeys([reportDay('2026-02-03', 1000), reportDay('2026-02-04', 0)]);
    expect([...keys]).toEqual(['2026-02-03']);
  });
});

describe('buildMonthGrid', () => {
  it('lays the month out in whole Sunday-to-Saturday weeks', () => {
    const weeks = grid();
    // 1 Feb 2026 is a Sunday and February has 28 days: exactly four weeks.
    expect(weeks).toHaveLength(4);
    expect(weeks.every((week) => week.cells.length === 7)).toBe(true);
    expect(weeks[0].cells[0].key).toBe('2026-02-01');
  });

  it('pads with the neighbouring months, marked as outside', () => {
    const weeks = buildMonthGrid(new Date(2026, 2, 1), {
      tracked: new Set(),
      selected: new Date(2026, 2, 1),
      maxDate: new Date(2026, 2, 31),
    });
    const last = weeks.at(-1)?.cells ?? [];
    // 31 March 2026 is a Tuesday, so the last week runs into April.
    expect(last.find((cell) => cell.key === '2026-04-01')?.inMonth).toBe(false);
    expect(last.find((cell) => cell.key === '2026-03-31')?.inMonth).toBe(true);
  });

  it('dots tracked days, marks the selected one and today, and locks the future', () => {
    const cells = grid(new Set(['2026-02-03'])).flatMap((week) => week.cells);
    const cell = (key: string) => cells.find((each) => each.key === key);

    expect(cell('2026-02-03')?.tracked).toBe(true);
    expect(cell('2026-02-04')?.tracked).toBe(false);
    expect(cell('2026-02-10')?.selected).toBe(true);
    expect(cell('2026-02-12')?.today).toBe(true);
    expect(cell('2026-02-12')?.disabled).toBe(false);
    expect(cell('2026-02-13')?.disabled).toBe(true);
  });

  it('gives every cell a unique key', () => {
    const keys = grid().flatMap((week) => week.cells.map((cell) => cell.key));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('weekdayLabels', () => {
  it('reads the weekday names off the first week', () => {
    expect(weekdayLabels(grid()[0]).map((header) => header.label)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import type { ReportDay } from '../../src/types';
import { buildReportCsv } from '../../src/report-csv';

const HOUR = 3_600_000;

const day = (date: string, activeMs: number, idleMs: number): ReportDay => ({
  date,
  activeMs,
  idleMs,
  keyCount: 100,
  mouseCount: 50,
  sessions: 2,
});

/** The file, split back into the rows a spreadsheet would read. */
function rows(content: string): string[] {
  return content.trimEnd().split('\n');
}

describe('buildReportCsv', () => {
  it('names the file after the month, so two exports never collide', () => {
    expect(buildReportCsv([], '2026-02').fileName).toBe('tracker-report-2026-02.csv');
  });

  it('writes one row per day, in date order whatever order the portal returned', () => {
    const csv = buildReportCsv([day('2026-02-11', HOUR, 0), day('2026-02-02', HOUR, 0)], '2026-02');

    const [, first, second] = rows(csv.content);
    expect(first.startsWith('2026-02-02')).toBe(true);
    expect(second.startsWith('2026-02-11')).toBe(true);
  });

  it('reports hours, not milliseconds — the file is read by a person', () => {
    const csv = buildReportCsv([day('2026-02-03', HOUR * 6.5, HOUR * 1.5)], '2026-02');

    expect(rows(csv.content)[1]).toBe('2026-02-03,6.50,1.50,81,100,50,2');
  });

  it('adds a totals row, because adding the month up is the first thing anybody does', () => {
    const csv = buildReportCsv(
      [day('2026-02-03', HOUR * 6, 0), day('2026-02-04', HOUR * 2, 0)],
      '2026-02',
    );

    const last = rows(csv.content).at(-1) ?? '';
    expect(last).toBe('Total,8.00,0.00,100,200,100,4');
  });

  it('still writes the header for an empty month, so the file is never a blank page', () => {
    const csv = buildReportCsv([], '2026-02');

    expect(rows(csv.content)[0].startsWith('Date,')).toBe(true);
    // Header and a totals row of zeroes — nothing that could be mistaken for a tracked day.
    expect(rows(csv.content)).toHaveLength(2);
  });

  it('ends with a newline, which some tools read a file without as truncated', () => {
    expect(buildReportCsv([day('2026-02-03', HOUR, 0)], '2026-02').content.endsWith('\n')).toBe(
      true,
    );
  });
});

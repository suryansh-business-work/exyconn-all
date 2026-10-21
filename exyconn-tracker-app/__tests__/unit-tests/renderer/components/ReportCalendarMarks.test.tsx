// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/ui';
import type { DayMark } from '@exyconn/tracker-core';
import type { ReportDay } from '@shared/types';
import ReportCalendar from '../../../../src/renderer/components/ReportCalendar';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

const DAYS: ReportDay[] = [
  { date: '2026-09-07', activeMs: 3_600_000, idleMs: 0, keyCount: 1, mouseCount: 1, sessions: 1 },
];

const MARKS = new Map<string, DayMark>([
  ['2026-09-07', 'SHORT'],
  ['2026-09-08', 'SHORT'],
  ['2026-09-09', 'LEAVE'],
  ['2026-09-10', 'HOLIDAY'],
  ['2026-09-13', 'WEEK_OFF'],
]);

const LABELS = new Map([
  ['2026-09-09', 'CL'],
  ['2026-09-10', 'Onam'],
]);

async function mountCalendar(): Promise<void> {
  await render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ReportCalendar
        days={DAYS}
        loading={false}
        marks={MARKS}
        labels={LABELS}
        selected={new Date(2026, 8, 14)}
        maxDate={new Date(2026, 8, 20)}
        onSelect={vi.fn()}
        onMonthChange={vi.fn()}
      />
    </LocalizationProvider>,
  );
}

function cell(day: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].find((node) =>
    node.textContent.startsWith(day),
  );
}

describe('ReportCalendar marks', () => {
  it('says each mark aloud, with the off day’s own name when it has one', async () => {
    await mountCalendar();
    expect(cell('7')?.getAttribute('aria-label')).toBe(
      'Mon 7 Sep, 1h 0m tracked, high activity, Short',
    );
    expect(cell('8')?.getAttribute('aria-label')).toBe('Tue 8 Sep, Short');
    expect(cell('9')?.getAttribute('aria-label')).toBe('Wed 9 Sep, Leave (CL)');
    expect(cell('10')?.getAttribute('aria-label')).toBe('Thu 10 Sep, Holiday (Onam)');
    expect(cell('13')?.getAttribute('aria-label')).toBe('Sun 13 Sep, Week off');
  });

  it('captions an off day with its name, and the week off as such, in place of the dot', async () => {
    await mountCalendar();
    expect(cell('9')?.parentElement?.textContent).toBe('9CL');
    expect(cell('10')?.parentElement?.textContent).toBe('10Onam');
    expect(cell('13')?.parentElement?.textContent).toBe('13Week off');
    expect(cell('8')?.parentElement?.textContent).toBe('8');
  });

  it('rings each mark in its own colour, and leaves an unmarked day plain', async () => {
    await mountCalendar();
    const ring = (day: string) => getComputedStyle(cell(day) as HTMLElement).boxShadow;
    expect(ring('8')).toMatch(/^inset 0 0 0 2px /);
    expect(ring('13')).toMatch(/^inset 0 0 0 2px /);
    expect(new Set([ring('8'), ring('9'), ring('10'), ring('13')]).size).toBe(4);
    expect(ring('15')).toBe('');
  });

  it('keys the rings in a legend, in order', async () => {
    await mountCalendar();
    const items = [...document.querySelectorAll('ul > li')].map((item) => item.textContent);
    expect(items).toEqual([
      'Completed',
      'Short',
      'Leave',
      'Holiday',
      'Week off',
      'Off Computer Work',
    ]);
  });
});

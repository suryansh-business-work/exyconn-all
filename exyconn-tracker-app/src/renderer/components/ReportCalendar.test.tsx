// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import ReportCalendar from './ReportCalendar';
import { click, render, rerender, unmountAll } from '../a11y/component-harness';

afterEach(unmountAll);

const DAYS: ReportDay[] = [
  { date: '2026-09-14', activeMs: 3_600_000, idleMs: 0, keyCount: 1, mouseCount: 1, sessions: 1 },
];

function calendar(loading: boolean, onSelect = vi.fn()) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ReportCalendar
        days={DAYS}
        loading={loading}
        selected={new Date(2026, 8, 14)}
        maxDate={new Date(2026, 8, 20)}
        onSelect={onSelect}
        onMonthChange={vi.fn()}
      />
    </LocalizationProvider>
  );
}

describe('ReportCalendar', () => {
  it('says the tracked days are loading in place of the key to the dots', async () => {
    await render(calendar(true));
    expect(document.body.textContent).toContain('Loading your tracked days…');
    expect(document.body.textContent).not.toContain('Dotted days');

    await rerender(calendar(false));
    expect(document.body.textContent).not.toContain('Loading your tracked days…');
    expect(document.body.textContent).toContain('Dotted days');
  });

  it('selects the day that is picked', async () => {
    const onSelect = vi.fn();
    await render(calendar(false, onSelect));
    const day = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].find(
      (cell) => cell.textContent === '15',
    );
    if (day === undefined) {
      throw new Error('No 15th');
    }
    await click(day);
    expect(onSelect).toHaveBeenCalledWith(new Date(2026, 8, 15));
  });
});

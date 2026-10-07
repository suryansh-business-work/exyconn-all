// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdapterDateFns, LocalizationProvider } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import ReportCalendar from '../../../../src/renderer/components/ReportCalendar';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

function day(date: string, activeMs: number, idleMs: number): ReportDay {
  return { date, activeMs, idleMs, keyCount: 1, mouseCount: 1, sessions: 1 };
}

const DAYS: ReportDay[] = [
  day('2026-09-14', 3_600_000, 0),
  day('2026-09-15T00:00:00.000Z', 600_000, 1_800_000),
  day('2026-09-16', 0, 0),
];

async function mountCalendar(onSelect = vi.fn()): Promise<void> {
  await render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ReportCalendar
        days={DAYS}
        loading={false}
        selected={new Date(2026, 8, 14)}
        maxDate={new Date(2026, 8, 20)}
        onSelect={onSelect}
        onMonthChange={vi.fn()}
      />
    </LocalizationProvider>,
  );
}

function cell(label: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].find(
    (node) => node.textContent === label,
  );
}

describe('ReportCalendar', () => {
  it('names each tracked day with its time and activity, so the dot is not the only cue', async () => {
    await mountCalendar();
    expect(cell('14')?.getAttribute('aria-label')).toBe('Mon 14 Sep, 1h 0m tracked, high activity');
    expect(cell('15')?.getAttribute('aria-label')).toBe('Tue 15 Sep, 40m tracked, low activity');
    // A day with nothing tracked is an ordinary day.
    expect(cell('16')).toBeDefined();
    expect(cell('16')?.getAttribute('aria-label') ?? '').not.toContain('tracked');
  });

  it('ignores a jump-to date that is not a real date', async () => {
    const onSelect = vi.fn();
    await mountCalendar(onSelect);
    const input = document.querySelector<HTMLInputElement>('input.MuiPickersInputBase-input');
    if (input === null) {
      throw new Error('No date input');
    }
    for (const value of ['', '13/45/2026']) {
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
          input,
          value,
        );
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    expect(onSelect).not.toHaveBeenCalled();
  });
});

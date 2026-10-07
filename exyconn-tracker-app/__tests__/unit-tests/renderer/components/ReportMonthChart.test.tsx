// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatHours } from '@exyconn/ui';
import type { ReportDay } from '@shared/types';
import ReportMonthChart from '../../../../src/renderer/components/ReportMonthChart';
import { button, clickElement, render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

// jsdom has no canvas; the chart's own drawing is not what is under test here.
vi.mock('react-chartjs-2', () => ({ Bar: () => null, Line: () => null }));

afterEach(unmountAll);

const DAYS: ReportDay[] = [
  {
    date: '2026-09-14',
    activeMs: 7_200_000,
    idleMs: 1_800_000,
    keyCount: 9,
    mouseCount: 9,
    sessions: 2,
  },
];

describe('ReportMonthChart', () => {
  it('says so on a month with nothing tracked', async () => {
    await render(<ReportMonthChart days={[]} monthLabel="September 2026" />);
    expect(pageText()).toContain('No time tracked this month.');
  });

  it('puts worked and idle hours side by side for each day in the table', async () => {
    await render(<ReportMonthChart days={DAYS} monthLabel="September 2026" />);
    expect(pageText()).toContain('Hours this month');
    expect(pageText()).toContain('September 2026 · each column is one day');

    await clickElement(button('Show the numbers as a table'));
    expect([...document.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Day',
      'Worked',
      'Idle',
    ]);
    expect([...document.querySelectorAll('tbody td')].map((cell) => cell.textContent)).toEqual([
      '14',
      formatHours(2),
      formatHours(0.5),
    ]);
  });
});

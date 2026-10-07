// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReportDay } from '@shared/types';
import ReportActivityChart from '../../../../src/renderer/components/ReportActivityChart';
import { button, clickElement, render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

// jsdom has no canvas; the chart's own drawing is not what is under test here.
vi.mock('react-chartjs-2', () => ({ Bar: () => null, Line: () => null }));

afterEach(unmountAll);

const DAYS: ReportDay[] = [
  {
    date: '2026-09-15',
    activeMs: 1_800_000,
    idleMs: 1_800_000,
    keyCount: 5,
    mouseCount: 5,
    sessions: 1,
  },
  {
    date: '2026-09-14',
    activeMs: 3_600_000,
    idleMs: 600_000,
    keyCount: 9,
    mouseCount: 9,
    sessions: 2,
  },
];

function cells(): string[] {
  return [...document.querySelectorAll('tbody td')].map((cell) => cell.textContent ?? '');
}

describe('ReportActivityChart', () => {
  it('says so on a month with nothing tracked', async () => {
    await render(<ReportActivityChart days={[]} monthLabel="September 2026" />);
    expect(pageText()).toContain('No time tracked this month.');
    expect(() => button('Show the numbers as a table')).toThrow();
  });

  it('titles the month and lists each day’s activity as a percentage in the table', async () => {
    await render(<ReportActivityChart days={DAYS} monthLabel="September 2026" />);
    expect(pageText()).toContain('Activity this month');
    expect(pageText()).toContain('September 2026 · share of tracked time that was active');

    await clickElement(button('Show the numbers as a table'));
    expect([...document.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Day',
      'Activity',
    ]);
    // Oldest first, whatever order the portal sent.
    expect(cells()).toEqual(['14', '86%', '15', '50%']);
  });
});

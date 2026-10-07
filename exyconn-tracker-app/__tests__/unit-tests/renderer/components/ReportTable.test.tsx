// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { ReportDay } from '@shared/types';
import ReportTable from '../../../../src/renderer/components/ReportTable';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const DAYS: ReportDay[] = [
  {
    date: '2026-09-14',
    activeMs: 27_000_000,
    idleMs: 1_800_000,
    keyCount: 12_304,
    mouseCount: 980,
    sessions: 3,
  },
  {
    date: '2026-09-15',
    activeMs: 1_200_000,
    idleMs: 2_400_000,
    keyCount: 40,
    mouseCount: 12,
    sessions: 1,
  },
];

function rows(): string[][] {
  return [...document.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? ''),
  );
}

describe('ReportTable', () => {
  it('holds skeleton rows while the month loads', async () => {
    await render(<ReportTable days={DAYS} loading />);
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(5);
    expect(document.querySelector('table')).toBeNull();
  });

  it('says so on a month with nothing tracked', async () => {
    await render(<ReportTable days={[]} loading={false} />);
    expect(pageText()).toBe(
      'No tracked time this monthDays appear here once you start tracking and sync.',
    );
  });

  it('lists each day with its time, activity and counts', async () => {
    await render(<ReportTable days={DAYS} loading={false} />);
    expect([...document.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Day',
      'Worked',
      'Idle',
      'Activity',
      'Keys',
      'Mouse',
      'Sessions',
    ]);
    expect(rows()).toEqual([
      ['Mon 14 Sep', '7h 30m', '30m', '94%', '12,304', '980', '3'],
      ['Tue 15 Sep', '20m', '40m', '33%', '40', '12', '1'],
    ]);
    expect(document.querySelector('.MuiChip-colorSuccess')?.textContent).toBe('94%');
    expect(document.querySelector('.MuiChip-colorWarning')?.textContent).toBe('33%');
  });
});

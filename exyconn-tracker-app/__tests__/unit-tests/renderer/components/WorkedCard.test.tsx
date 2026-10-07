// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { PeriodTotals } from '@exyconn/tracker-core';
import WorkedCard from '../../../../src/renderer/components/WorkedCard';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

function totals(activeMs: number, idleMs: number, activityPercent: number): PeriodTotals {
  return {
    activeMs,
    idleMs,
    activityPercent,
    keyCount: 0,
    mouseCount: 0,
    sessions: 0,
    trackedDays: 0,
  };
}

describe('WorkedCard', () => {
  it('shows the period’s worked time, how active it was and how it moved', async () => {
    await render(
      <WorkedCard
        current={totals(10_800_000, 3_600_000, 75)}
        previous={totals(7_200_000, 0, 100)}
        before="the 7 days before"
      />,
    );
    expect(pageText()).toContain('Worked');
    expect(pageText()).toContain('3h 0m+50%');
    expect(pageText()).toContain('1h 0m idle');
    expect(pageText()).toContain('2h 0m the 7 days before.');
    const bar = document.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuenow')).toBe('75');
    expect(bar?.getAttribute('aria-label')).toBe('75% of tracked time was active');
  });

  it('shows no change when the period before had nothing in it', async () => {
    await render(
      <WorkedCard
        current={totals(3_600_000, 0, 100)}
        previous={totals(0, 0, 0)}
        before="the 30 days before"
      />,
    );
    expect(pageText()).toContain('1h 0m');
    expect(document.querySelector('span.MuiBox-root')).toBeNull();
    expect(pageText()).toContain('0m the 30 days before.');
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReportDay } from '@shared/types';
import ReportOverview from './ReportOverview';
import { click, deferred, flush, render, stubTracker, unmountAll } from '../a11y/component-harness';

afterEach(() => {
  unmountAll();
  vi.useRealTimers();
});

function skeletons(): number {
  return document.querySelectorAll('.MuiSkeleton-root').length;
}

describe('ReportOverview', () => {
  it('holds skeletons for every figure until the period arrives — never a row of zeros', async () => {
    const answer = deferred<ReportDay[]>();
    stubTracker({ getReport: () => answer.promise });
    await render(<ReportOverview timezone="UTC" />);
    // The worked card, the stripes and the four counts.
    expect(skeletons()).toBe(6);
    expect(document.body.textContent).not.toContain('Keystrokes');

    answer.resolve([]);
    await flush();
    expect(skeletons()).toBe(0);
    expect(document.body.textContent).toContain('Keystrokes');
  });

  it('compares the period with the one before, and switches to 30 days on request', async () => {
    const day = (date: string, activeMs: number): ReportDay => ({
      date,
      activeMs,
      idleMs: 0,
      keyCount: 10,
      mouseCount: 10,
      sessions: 1,
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-20T12:00:00.000Z'));
    const getReport = vi.fn(() =>
      Promise.resolve([day('2026-09-10', 3_600_000), day('2026-09-18', 7_200_000)]),
    );
    stubTracker({ getReport });
    await render(<ReportOverview timezone="UTC" />);
    await flush();
    expect(document.body.textContent).toContain('the 7 days before');
    const thirty = [...document.querySelectorAll<HTMLElement>('[aria-pressed]')].find(
      (chip) => chip.textContent === 'Last 30 days',
    );
    if (thirty === undefined) {
      throw new Error('No 30-day chip');
    }
    await click(thirty);
    expect(thirty.getAttribute('aria-pressed')).toBe('true');
    expect(getReport).toHaveBeenCalledTimes(2);
  });
});

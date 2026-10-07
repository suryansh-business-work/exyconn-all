// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReportDay } from '@shared/types';
import useMyReport, { type ReportQuery } from '../../../../src/renderer/hooks/useMyReport';
import { deferred, flush, render, rerender, stubTracker, unmountAll } from '../../test-utils';

function day(date: string, activeMs: number, idleMs: number): ReportDay {
  return { date, activeMs, idleMs, keyCount: 10, mouseCount: 5, sessions: 1 };
}

const DAYS = [day('2026-09-01', 3_000_000, 1_000_000), day('2026-09-02', 600_000, 400_000)];
const EMPTY_TOTALS = { activeMs: 0, idleMs: 0, activityPercent: 0 };

let latest: ReportQuery = { days: [], totals: EMPTY_TOTALS, loading: false, error: null };

function Probe({ month, zone }: Readonly<{ month: Date; zone: string }>): ReactElement {
  latest = useMyReport(month, zone);
  return <span />;
}

const SEPTEMBER = new Date(2026, 8, 1);

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe('useMyReport', () => {
  it('asks for the whole month in the chosen zone and sums its days', async () => {
    const answer = deferred<ReportDay[]>();
    const getReport = vi.fn(() => answer.promise);
    stubTracker({ getReport });
    await render(<Probe month={SEPTEMBER} zone="UTC" />);
    expect(getReport).toHaveBeenCalledWith('2026-09-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z');
    expect(latest).toEqual({ days: [], totals: EMPTY_TOTALS, loading: true, error: null });

    answer.resolve(DAYS);
    await flush();
    expect(latest).toEqual({
      days: DAYS,
      totals: { activeMs: 3_600_000, idleMs: 1_400_000, activityPercent: 72 },
      loading: false,
      error: null,
    });
  });

  it('empties the month and explains when the portal fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getReport = vi.fn().mockResolvedValueOnce(DAYS).mockRejectedValueOnce(new Error('x'));
    stubTracker({ getReport });
    await render(<Probe month={SEPTEMBER} zone="UTC" />);
    await flush();
    await rerender(<Probe month={new Date(2026, 7, 1)} zone="UTC" />);
    await flush();
    expect(getReport).toHaveBeenLastCalledWith(
      '2026-08-01T00:00:00.000Z',
      '2026-09-01T00:00:00.000Z',
    );
    expect(latest).toEqual({
      days: [],
      totals: EMPTY_TOTALS,
      loading: false,
      error: 'Could not load your report. Check your connection and try again.',
    });
    expect(log).toHaveBeenCalledWith('Failed to load report', expect.any(Error));
  });

  it('does not re-ask for the same month on a re-render', async () => {
    const getReport = vi.fn(() => Promise.resolve(DAYS));
    stubTracker({ getReport });
    await render(<Probe month={SEPTEMBER} zone="UTC" />);
    await rerender(<Probe month={new Date(2026, 8, 20)} zone="UTC" />);
    await flush();
    expect(getReport).toHaveBeenCalledTimes(1);
  });

  it('ignores the answer for a month that is no longer shown', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const first = deferred<ReportDay[]>();
    const second = deferred<ReportDay[]>();
    const third = deferred<ReportDay[]>();
    const getReport = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    stubTracker({ getReport });
    await render(<Probe month={SEPTEMBER} zone="UTC" />);
    await rerender(<Probe month={SEPTEMBER} zone="Asia/Kolkata" />);
    await rerender(<Probe month={SEPTEMBER} zone="America/New_York" />);
    first.resolve(DAYS);
    second.reject(new Error('late'));
    await flush();
    expect(latest.loading).toBe(true);
    expect(latest.error).toBeNull();
    third.resolve([]);
    await flush();
    expect(latest).toEqual({ days: [], totals: EMPTY_TOTALS, loading: false, error: null });
  });
});

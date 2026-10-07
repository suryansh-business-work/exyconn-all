// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrackerTotals } from '@shared/types';
import useTotals, { type TotalsQuery } from '../../../../src/renderer/hooks/useTotals';
import { deferred, flush, render, rerender, stubTracker, unmountAll } from '../../test-utils';

const TOTALS: TrackerTotals = {
  activeMs: 7_200_000,
  idleMs: 900_000,
  screenshots: 12,
  sessions: 4,
};

let latest: TotalsQuery = { totals: null, loading: false, error: null };

function Probe({ lastSyncAt }: Readonly<{ lastSyncAt: string | null }>): ReactElement {
  latest = useTotals(lastSyncAt);
  return <span />;
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe('useTotals', () => {
  it('loads the all-time totals', async () => {
    const answer = deferred<TrackerTotals>();
    stubTracker({ getTotals: () => answer.promise });
    await render(<Probe lastSyncAt={null} />);
    expect(latest).toEqual({ totals: null, loading: true, error: null });
    answer.resolve(TOTALS);
    await flush();
    expect(latest).toEqual({ totals: TOTALS, loading: false, error: null });
  });

  it('re-reads only when a sync lands', async () => {
    const getTotals = vi.fn(() => Promise.resolve(TOTALS));
    stubTracker({ getTotals });
    await render(<Probe lastSyncAt="2026-09-14T10:00:00.000Z" />);
    await flush();
    await rerender(<Probe lastSyncAt="2026-09-14T10:00:00.000Z" />);
    expect(getTotals).toHaveBeenCalledTimes(1);
    await rerender(<Probe lastSyncAt="2026-09-14T10:05:00.000Z" />);
    await flush();
    expect(getTotals).toHaveBeenCalledTimes(2);
  });

  it('keeps the last totals but says it could not refresh them', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getTotals = vi
      .fn()
      .mockResolvedValueOnce(TOTALS)
      .mockRejectedValueOnce(new Error('Offline'));
    stubTracker({ getTotals });
    await render(<Probe lastSyncAt="a" />);
    await flush();
    await rerender(<Probe lastSyncAt="b" />);
    await flush();
    expect(latest).toEqual({
      totals: TOTALS,
      loading: false,
      error: 'Could not load your all-time totals.',
    });
    expect(log).toHaveBeenCalledWith('Failed to load totals', expect.any(Error));
  });

  it('ignores answers that a newer sync has overtaken', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const first = deferred<TrackerTotals>();
    const second = deferred<TrackerTotals>();
    const third = deferred<TrackerTotals>();
    const getTotals = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    stubTracker({ getTotals });
    await render(<Probe lastSyncAt="a" />);
    await rerender(<Probe lastSyncAt="b" />);
    await rerender(<Probe lastSyncAt="c" />);
    first.resolve(TOTALS);
    second.reject(new Error('Too late'));
    await flush();
    expect(latest).toEqual({ totals: null, loading: true, error: null });
    third.resolve({ ...TOTALS, sessions: 5 });
    await flush();
    expect(latest.totals?.sessions).toBe(5);
  });
});

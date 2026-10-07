// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DayDetail } from '@shared/types';
import useMyDay, { type DayQuery } from '../../../../src/renderer/hooks/useMyDay';
import { deferred, flush, render, rerender, stubTracker, unmountAll } from '../../test-utils';

const DETAIL: DayDetail = {
  activeMs: 60_000,
  idleMs: 0,
  keyCount: 1,
  mouseCount: 2,
  sessions: 1,
  screenshots: [],
  intervals: [],
};

let latest: DayQuery = { detail: null, loading: false, error: null };

interface ProbeProps {
  date: Date;
  zone: string;
  refreshKey?: string | null;
}

function Probe({ date, zone, refreshKey }: Readonly<ProbeProps>): ReactElement {
  latest = useMyDay(date, zone, refreshKey);
  return <span />;
}

const SEPT_14 = new Date(2026, 8, 14);

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

describe('useMyDay', () => {
  it('asks for the clicked date midnight-to-midnight in the chosen zone', async () => {
    const answer = deferred<DayDetail>();
    const getDay = vi.fn(() => answer.promise);
    stubTracker({ getDay });
    await render(<Probe date={SEPT_14} zone="Asia/Kolkata" />);
    expect(getDay).toHaveBeenCalledWith('2026-09-13T18:30:00.000Z', '2026-09-14T18:30:00.000Z');
    expect(latest).toEqual({ detail: null, loading: true, error: null });

    answer.resolve(DETAIL);
    await flush();
    expect(latest).toEqual({ detail: DETAIL, loading: false, error: null });
  });

  it('re-reads the same day when the refresh key moves, and not otherwise', async () => {
    const getDay = vi.fn(() => Promise.resolve(DETAIL));
    stubTracker({ getDay });
    await render(<Probe date={SEPT_14} zone="UTC" refreshKey="sync-1" />);
    await flush();
    await rerender(<Probe date={new Date(2026, 8, 14)} zone="UTC" refreshKey="sync-1" />);
    await flush();
    expect(getDay).toHaveBeenCalledTimes(1);
    await rerender(<Probe date={SEPT_14} zone="UTC" refreshKey="sync-2" />);
    await flush();
    expect(getDay).toHaveBeenCalledTimes(2);
    expect(getDay).toHaveBeenLastCalledWith('2026-09-14T00:00:00.000Z', '2026-09-15T00:00:00.000Z');
  });

  it('drops a stale day and says so, in words, when the portal fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getDay = vi
      .fn()
      .mockResolvedValueOnce(DETAIL)
      .mockRejectedValueOnce(new Error('Offline'));
    stubTracker({ getDay });
    await render(<Probe date={SEPT_14} zone="UTC" />);
    await flush();
    expect(latest.detail).toEqual(DETAIL);

    await rerender(<Probe date={new Date(2026, 8, 15)} zone="UTC" />);
    await flush();
    expect(latest).toEqual({
      detail: null,
      loading: false,
      error: 'Could not load this day. Check your connection and try again.',
    });
    expect(log).toHaveBeenCalledWith('Failed to load day', expect.any(Error));
  });

  it('ignores answers for a day that is no longer shown', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const first = deferred<DayDetail>();
    const second = deferred<DayDetail>();
    const third = deferred<DayDetail>();
    const getDay = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    stubTracker({ getDay });
    await render(<Probe date={SEPT_14} zone="UTC" />);
    await rerender(<Probe date={new Date(2026, 8, 15)} zone="UTC" />);
    await rerender(<Probe date={new Date(2026, 8, 16)} zone="UTC" />);
    first.resolve(DETAIL);
    second.reject(new Error('Too late'));
    await flush();
    expect(latest).toEqual({ detail: null, loading: true, error: null });

    const later = { ...DETAIL, sessions: 3 };
    third.resolve(later);
    await flush();
    expect(latest).toEqual({ detail: later, loading: false, error: null });
  });
});

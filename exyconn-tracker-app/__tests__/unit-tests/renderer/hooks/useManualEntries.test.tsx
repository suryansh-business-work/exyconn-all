// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ManualEntry } from '@shared/types';
import useManualEntries, {
  type ManualEntriesQuery,
} from '../../../../src/renderer/hooks/useManualEntries';
import { deferred, flush, render, stubTracker, unmountAll } from '../../test-utils';

const DAY_MS = 86_400_000;

const ENTRY: ManualEntry = {
  id: 'e1',
  projectName: 'Global Project',
  taskKey: 'EXY-1',
  taskTitle: 'Onboarding',
  startedAt: '2026-09-14T09:00:00.000Z',
  endedAt: '2026-09-14T10:00:00.000Z',
  durationMs: 3_600_000,
  note: 'Client visit',
  status: 'PENDING',
  reviewNote: '',
};

let latest: ManualEntriesQuery | null = null;

function Probe(): ReactElement {
  latest = useManualEntries();
  return <span />;
}

function current(): ManualEntriesQuery {
  if (latest === null) {
    throw new Error('Probe not rendered');
  }
  return latest;
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  latest = null;
});

describe('useManualEntries', () => {
  it('loads the last 90 days of claims, the furthest back the portal still accepts', async () => {
    const answer = deferred<ManualEntry[]>();
    const getManualEntries = vi.fn((_from: string, _to: string) => answer.promise);
    stubTracker({ getManualEntries });
    await render(<Probe />);
    expect(current().loading).toBe(true);

    const [from, to] = getManualEntries.mock.calls[0];
    const span = new Date(to).getTime() - new Date(from).getTime();
    // subDays works in local days, so a DST change inside the window moves it by an hour.
    expect(Math.abs(span - 90 * DAY_MS)).toBeLessThanOrEqual(3_600_000);

    answer.resolve([ENTRY]);
    await flush();
    expect(current()).toMatchObject({ entries: [ENTRY], loading: false, error: null });
  });

  it('reloads on request', async () => {
    const getManualEntries = vi.fn().mockResolvedValueOnce([ENTRY]).mockResolvedValueOnce([]);
    stubTracker({ getManualEntries });
    await render(<Probe />);
    await flush();
    expect(current().entries).toEqual([ENTRY]);
    act(() => current().reload());
    await flush();
    expect(getManualEntries).toHaveBeenCalledTimes(2);
    expect(current().entries).toEqual([]);
  });

  it('empties the list and explains when the claims cannot be read', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getManualEntries = vi
      .fn()
      .mockResolvedValueOnce([ENTRY])
      .mockRejectedValueOnce(new Error('Offline'));
    stubTracker({ getManualEntries });
    await render(<Probe />);
    await flush();
    act(() => current().reload());
    await flush();
    expect(current()).toMatchObject({
      entries: [],
      loading: false,
      error: 'Could not load your claims. Check your connection and try again.',
    });
    expect(log).toHaveBeenCalledWith('Failed to load off-computer time', expect.any(Error));
  });

  it('ignores answers that a reload has overtaken', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const first = deferred<ManualEntry[]>();
    const second = deferred<ManualEntry[]>();
    const third = deferred<ManualEntry[]>();
    const getManualEntries = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise);
    stubTracker({ getManualEntries });
    await render(<Probe />);
    act(() => current().reload());
    act(() => current().reload());
    first.resolve([ENTRY]);
    second.reject(new Error('late'));
    await flush();
    expect(current()).toMatchObject({ entries: [], loading: true, error: null });
    third.resolve([ENTRY]);
    await flush();
    expect(current()).toMatchObject({ entries: [ENTRY], loading: false, error: null });
  });
});

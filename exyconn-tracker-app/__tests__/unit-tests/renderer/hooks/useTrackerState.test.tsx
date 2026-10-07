// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrackerState } from '@shared/types';
import useTrackerState from '../../../../src/renderer/hooks/useTrackerState';
import { deferred, flush, render, stubTracker, trackerState, unmountAll } from '../../test-utils';

type Listener = (state: TrackerState) => void;

let latest: TrackerState | null = null;
let listener: Listener = () => undefined;
const unsubscribe = vi.fn();

function Probe(): ReactElement {
  latest = useTrackerState();
  return <span />;
}

function install(getState: () => Promise<TrackerState>): void {
  stubTracker({
    onStateChanged: (next: Listener) => {
      listener = next;
      return unsubscribe;
    },
    getState,
  });
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  unsubscribe.mockClear();
  latest = null;
});

describe('useTrackerState', () => {
  it('is null until the first snapshot, then follows every push', async () => {
    const answer = deferred<TrackerState>();
    install(() => answer.promise);
    await render(<Probe />);
    expect(latest).toBeNull();

    const idle = trackerState('idle');
    answer.resolve(idle);
    await flush();
    expect(latest).toBe(idle);

    const tracking = trackerState('tracking');
    act(() => listener(tracking));
    expect(latest).toBe(tracking);
  });

  it('stays null and logs when the first snapshot fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    install(() => Promise.reject(new Error('IPC down')));
    await render(<Probe />);
    await flush();
    expect(latest).toBeNull();
    expect(log).toHaveBeenCalledWith('Failed to load tracker state', expect.any(Error));
  });

  it('unsubscribes on unmount and ignores late snapshots', async () => {
    const answer = deferred<TrackerState>();
    install(() => answer.promise);
    await render(<Probe />);
    unmountAll();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    listener(trackerState('paused'));
    answer.resolve(trackerState('idle'));
    await flush();
    expect(latest).toBeNull();
  });
});

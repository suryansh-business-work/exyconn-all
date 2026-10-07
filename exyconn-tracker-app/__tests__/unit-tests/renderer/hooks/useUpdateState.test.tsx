// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UpdateState } from '@shared/types';
import useUpdateState from '../../../../src/renderer/hooks/useUpdateState';
import { deferred, flush, render, stubTracker, unmountAll } from '../../test-utils';

type Listener = (update: UpdateState) => void;

const IDLE: UpdateState = { stage: 'idle', version: '', percent: 0, lastCheckedAt: null };
const AVAILABLE: UpdateState = {
  stage: 'available',
  version: '2.0.0',
  percent: 0,
  lastCheckedAt: '2026-09-14T10:00:00.000Z',
};
const DOWNLOADING: UpdateState = { ...AVAILABLE, stage: 'downloading', percent: 40 };

let latest: UpdateState = IDLE;
let listener: Listener = () => undefined;
const unsubscribe = vi.fn();

function Probe(): ReactElement {
  latest = useUpdateState();
  return <span />;
}

function install(getUpdate: () => Promise<UpdateState>): void {
  stubTracker({
    onUpdateChanged: (next: Listener) => {
      listener = next;
      return unsubscribe;
    },
    getUpdate,
  });
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  unsubscribe.mockClear();
});

describe('useUpdateState', () => {
  it('starts idle, takes main’s current state, then follows each push', async () => {
    const answer = deferred<UpdateState>();
    install(() => answer.promise);
    await render(<Probe />);
    expect(latest).toEqual(IDLE);
    answer.resolve(AVAILABLE);
    await flush();
    expect(latest).toEqual(AVAILABLE);
    act(() => listener(DOWNLOADING));
    expect(latest).toEqual(DOWNLOADING);
  });

  it('stays idle and logs when the state cannot be read', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    install(() => Promise.reject(new Error('IPC down')));
    await render(<Probe />);
    await flush();
    expect(latest).toEqual(IDLE);
    expect(log).toHaveBeenCalledWith('Failed to read the update state', expect.any(Error));
  });

  it('unsubscribes on unmount and ignores whatever arrives afterwards', async () => {
    const answer = deferred<UpdateState>();
    install(() => answer.promise);
    await render(<Probe />);
    unmountAll();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    listener(DOWNLOADING);
    answer.resolve(AVAILABLE);
    await flush();
    expect(latest).toEqual(IDLE);
  });
});

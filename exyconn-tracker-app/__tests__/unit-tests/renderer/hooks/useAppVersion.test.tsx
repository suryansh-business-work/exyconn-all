// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useAppVersion from '../../../../src/renderer/hooks/useAppVersion';
import { deferred, flush, render, stubTracker, unmountAll } from '../../test-utils';

let latest = 'unset';

function Probe(): ReactElement {
  latest = useAppVersion();
  return <span />;
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  latest = 'unset';
});

describe('useAppVersion', () => {
  it('is blank until main answers, then reads the installed version once', async () => {
    const answer = deferred<string>();
    const getAppVersion = vi.fn(() => answer.promise);
    stubTracker({ getAppVersion });
    await render(<Probe />);
    expect(latest).toBe('');
    answer.resolve('1.10.6');
    await flush();
    expect(latest).toBe('1.10.6');
    expect(getAppVersion).toHaveBeenCalledTimes(1);
  });

  it('stays blank and logs when the version cannot be read', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubTracker({ getAppVersion: () => Promise.reject(new Error('IPC down')) });
    await render(<Probe />);
    await flush();
    expect(latest).toBe('');
    expect(log).toHaveBeenCalledWith('Could not read the app version', expect.any(Error));
  });

  it('does not update a panel that has already closed', async () => {
    const answer = deferred<string>();
    stubTracker({ getAppVersion: () => answer.promise });
    await render(<Probe />);
    unmountAll();
    answer.resolve('2.0.0');
    await flush();
    expect(latest).toBe('');
  });
});

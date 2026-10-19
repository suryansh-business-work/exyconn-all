// @vitest-environment jsdom
import { type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import usePortalRead, { type PortalRead } from '../../../../src/renderer/hooks/usePortalRead';
import { deferred, render, rerender, settle, unmountAll } from '../../test-utils';

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

let seen: PortalRead<string> = { data: null, loading: true, failed: false };

function Probe({
  read,
  refreshKey,
}: Readonly<{ read: () => Promise<string>; refreshKey: string }>): ReactElement {
  seen = usePortalRead(read, refreshKey, 'the thing');
  return <span />;
}

describe('usePortalRead', () => {
  it('loads, then holds the answer', async () => {
    await render(<Probe read={() => Promise.resolve('one')} refreshKey="a" />);
    await settle();
    expect(seen).toEqual({ data: 'one', loading: false, failed: false });
  });

  it('re-reads only when the key changes, keeping the last answer when it fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const read = vi.fn(() => Promise.resolve('one'));
    await render(<Probe read={read} refreshKey="a" />);
    await settle();
    await rerender(<Probe read={read} refreshKey="a" />);
    expect(read).toHaveBeenCalledTimes(1);

    const failing = vi.fn(() => Promise.reject(new Error('offline')));
    await rerender(<Probe read={failing} refreshKey="b" />);
    await settle();
    expect(seen).toEqual({ data: 'one', loading: false, failed: true });
    expect(error).toHaveBeenCalledWith('Failed to load the thing', expect.any(Error));

    await rerender(<Probe read={() => Promise.resolve('two')} refreshKey="c" />);
    await settle();
    expect(seen).toEqual({ data: 'two', loading: false, failed: false });
  });

  it('ignores the answer of a read it has moved on from', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const late = deferred<string>();
    const lateFailure = deferred<string>();
    await render(<Probe read={() => late.promise} refreshKey="a" />);
    await rerender(<Probe read={() => lateFailure.promise} refreshKey="b" />);
    await rerender(<Probe read={() => Promise.resolve('now')} refreshKey="c" />);
    await settle();

    late.resolve('stale');
    lateFailure.reject(new Error('late'));
    await settle();
    expect(seen).toEqual({ data: 'now', loading: false, failed: false });
  });
});

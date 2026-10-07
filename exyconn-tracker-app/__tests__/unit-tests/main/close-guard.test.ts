import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';
import { IPC } from '@shared/types';
import { holdForUpload, isHoldingClose } from '../../../src/main/close-guard';

/** A window that records what the guard told it. */
function fakeWindow(destroyed = false) {
  const send = vi.fn();
  const show = vi.fn();
  const win = { isDestroyed: () => destroyed, show, webContents: { send } };
  return { win: win as unknown as BrowserWindow, send, show };
}

describe('holdForUpload', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Let any wait a test left running finish, so the module-level flag is clear again.
    vi.advanceTimersByTime(60_000);
    vi.useRealTimers();
  });

  it('lets the window close when nothing is going up', () => {
    const release = vi.fn();
    const { win, show } = fakeWindow();

    expect(holdForUpload(win, { isSyncing: () => false, pending: () => 0, release })).toBe(false);
    expect(show).not.toHaveBeenCalled();
    expect(isHoldingClose()).toBe(false);
  });

  it('shows the window, says what is pending, and quits once the upload lands', () => {
    let syncing = true;
    const release = vi.fn();
    const { win, send, show } = fakeWindow();

    const held = holdForUpload(win, { isSyncing: () => syncing, pending: () => 3, release });

    expect(held).toBe(true);
    expect(isHoldingClose()).toBe(true);
    expect(show).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith(IPC.closeBlocked, 3);

    vi.advanceTimersByTime(1_000);
    expect(release).not.toHaveBeenCalled();

    syncing = false;
    vi.advanceTimersByTime(500);
    expect(release).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(IPC.closeReleased);
    expect(isHoldingClose()).toBe(false);
  });

  it('does not stack a second wait on a second close', () => {
    const release = vi.fn();
    const hooks = { isSyncing: () => true, pending: () => 1, release };
    const { win, send } = fakeWindow();

    expect(holdForUpload(win, hooks)).toBe(true);
    expect(holdForUpload(win, hooks)).toBe(true);

    expect(send).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('gives up waiting after thirty seconds so nobody is trapped', () => {
    const release = vi.fn();
    const { win } = fakeWindow();

    holdForUpload(win, { isSyncing: () => true, pending: () => 2, release });
    vi.advanceTimersByTime(29_500);
    expect(release).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('still holds and releases with no window, or a destroyed one, to talk to', () => {
    const release = vi.fn();
    let syncing = true;
    const hooks = { isSyncing: () => syncing, pending: () => 1, release };

    expect(holdForUpload(null, hooks)).toBe(true);
    syncing = false;
    vi.advanceTimersByTime(500);
    expect(release).toHaveBeenCalledTimes(1);

    const { win, send, show } = fakeWindow(true);
    syncing = true;
    expect(holdForUpload(win, hooks)).toBe(true);
    syncing = false;
    vi.advanceTimersByTime(500);

    expect(show).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(2);
  });
});

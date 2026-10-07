import { act, renderHook } from '@testing-library/react';
import type { TrackerMessage, TrackerMessageKind } from '@exyconn/tracker-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMessages } from '../../../src/hooks/useMessages';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({
  tracker: { getMessages: vi.fn(), markMessagesRead: vi.fn(), sendMessage: vi.fn() },
}));

const LOAD_FAILED = 'Could not load your messages. Check your connection and try again.';

function message(id: string, kind: TrackerMessageKind = 'CHAT'): TrackerMessage {
  return {
    id,
    kind,
    direction: 'TO_EMPLOYEE',
    title: '',
    body: `Line ${id}`,
    authorName: 'Admin',
    readAt: null,
    createdAt: '2026-09-11T10:00:00.000Z',
  };
}

/** Lets every settled promise run its callbacks, and moves the clock by `ms`. */
async function settle(ms = 0): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('useMessages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(tracker.markMessagesRead).mockResolvedValue(0);
  });

  it('loads the thread and marks what was addressed to the employee as read', async () => {
    vi.mocked(tracker.getMessages).mockResolvedValue([message('1')]);
    const { result } = renderHook(() => useMessages('CHAT'));
    expect(result.current.loading).toBe(true);
    await settle();
    expect(result.current.messages).toEqual([message('1')]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(tracker.getMessages).toHaveBeenCalledWith('CHAT');
    expect(tracker.markMessagesRead).toHaveBeenCalledWith('CHAT');
  });

  it('re-reads the open thread every ten seconds', async () => {
    vi.mocked(tracker.getMessages)
      .mockResolvedValueOnce([message('1')])
      .mockResolvedValueOnce([message('1'), message('2')]);
    const { result } = renderHook(() => useMessages('CHAT'));
    await settle(9_999);
    expect(tracker.getMessages).toHaveBeenCalledTimes(1);
    await settle(1);
    await settle();
    expect(tracker.getMessages).toHaveBeenCalledTimes(2);
    expect(result.current.messages).toHaveLength(2);
  });

  it('says so when the thread cannot be read, and clears it once a refresh works', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(tracker.getMessages)
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('still offline'))
      .mockResolvedValueOnce([message('1')]);
    const { result } = renderHook(() => useMessages('CHAT'));
    await settle();
    expect(result.current.error).toBe(LOAD_FAILED);
    expect(result.current.loading).toBe(false);
    await settle(10_000);
    await settle();
    expect(result.current.error).toBe(LOAD_FAILED);
    await settle(10_000);
    await settle();
    expect(result.current.error).toBeNull();
    expect(error).toHaveBeenCalledWith('Failed to load messages', expect.any(Error));
  });

  it('logs a failed read receipt without disturbing the thread', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('refused');
    vi.mocked(tracker.getMessages).mockResolvedValue([message('1')]);
    vi.mocked(tracker.markMessagesRead).mockRejectedValue(cause);
    const { result } = renderHook(() => useMessages('CHAT'));
    await settle();
    expect(error).toHaveBeenCalledWith('Marking messages read failed', cause);
    expect(result.current.error).toBeNull();
  });

  it("sends, then shows the portal's copy of the thread", async () => {
    vi.mocked(tracker.getMessages)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([message('9')]);
    vi.mocked(tracker.sendMessage).mockResolvedValue(message('9'));
    const { result } = renderHook(() => useMessages('CHAT'));
    await settle();
    await act(() => result.current.send('Hello'));
    expect(tracker.sendMessage).toHaveBeenCalledWith('Hello');
    expect(result.current.messages).toEqual([message('9')]);
  });

  it('rejects with the reason a send was refused, without re-reading', async () => {
    vi.mocked(tracker.getMessages).mockResolvedValue([]);
    vi.mocked(tracker.sendMessage).mockRejectedValue(new Error('Too long'));
    const { result } = renderHook(() => useMessages('CHAT'));
    await settle();
    await expect(result.current.send('x')).rejects.toThrow('Too long');
    expect(tracker.getMessages).toHaveBeenCalledTimes(1);
  });

  it('stops refreshing once the screen is left, and ignores a late answer', async () => {
    const rows = deferred<TrackerMessage[]>();
    vi.mocked(tracker.getMessages).mockReturnValue(rows.promise);
    const { result, unmount } = renderHook(() => useMessages('CHAT'));
    unmount();
    rows.resolve([message('1')]);
    await settle(30_000);
    expect(tracker.getMessages).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("never lets the other tab's late answer land in the one being read", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const chat = deferred<TrackerMessage[]>();
    const chatAgain = deferred<TrackerMessage[]>();
    vi.mocked(tracker.getMessages)
      .mockReturnValueOnce(chat.promise)
      .mockResolvedValueOnce([message('n1', 'NOTICE')])
      .mockReturnValueOnce(chatAgain.promise)
      .mockResolvedValue([message('n1', 'NOTICE')]);
    const { result, rerender } = renderHook(({ kind }) => useMessages(kind), {
      initialProps: { kind: 'CHAT' as TrackerMessageKind },
    });
    rerender({ kind: 'NOTICE' });
    await settle();
    chat.resolve([message('c1')]);
    await settle();
    expect(result.current.messages).toEqual([message('n1', 'NOTICE')]);
    rerender({ kind: 'CHAT' });
    rerender({ kind: 'NOTICE' });
    chatAgain.reject(new Error('offline'));
    await settle();
    expect(result.current.error).toBeNull();
  });
});

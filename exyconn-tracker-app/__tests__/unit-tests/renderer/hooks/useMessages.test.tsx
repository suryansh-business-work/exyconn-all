// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackerMessage, TrackerMessageKind } from '@shared/types';
import useMessages, { type MessagesQuery } from '../../../../src/renderer/hooks/useMessages';
import { deferred, flush, render, rerender, stubTracker, unmountAll } from '../../test-utils';

function message(id: string, kind: TrackerMessageKind = 'CHAT'): TrackerMessage {
  return {
    id,
    kind,
    direction: 'TO_EMPLOYEE',
    title: '',
    body: `Body ${id}`,
    authorName: 'Tracker desk',
    readAt: null,
    createdAt: '2026-09-14T10:00:00.000Z',
  };
}

const LOAD_ERROR = 'Could not load your messages. Check your connection and try again.';

let latest: MessagesQuery | null = null;

function Probe({ kind }: Readonly<{ kind: TrackerMessageKind }>): ReactElement {
  latest = useMessages(kind);
  return <span />;
}

function current(): MessagesQuery {
  if (latest === null) {
    throw new Error('Probe not rendered');
  }
  return latest;
}

const markMessagesRead = vi.fn((_kind: TrackerMessageKind) => Promise.resolve(1));

beforeEach(() => {
  // Only the refresh interval: the harness settles on real timeouts.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  markMessagesRead.mockClear();
});

afterEach(() => {
  unmountAll();
  vi.useRealTimers();
  vi.restoreAllMocks();
  latest = null;
});

describe('useMessages', () => {
  it('loads the thread, and opening it marks it read', async () => {
    const answer = deferred<TrackerMessage[]>();
    const getMessages = vi.fn((_kind: TrackerMessageKind) => answer.promise);
    stubTracker({ getMessages, markMessagesRead });
    await render(<Probe kind="NOTICE" />);
    expect(current()).toMatchObject({ messages: [], loading: true, error: null, sending: false });
    expect(getMessages).toHaveBeenCalledWith('NOTICE');
    expect(markMessagesRead).toHaveBeenCalledWith('NOTICE');

    answer.resolve([message('n1', 'NOTICE')]);
    await flush();
    expect(current()).toMatchObject({ messages: [message('n1', 'NOTICE')], loading: false });
  });

  it('says so when the thread cannot be read, and clears it once a refresh works', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getMessages = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockRejectedValueOnce(new Error('Still offline'))
      .mockResolvedValueOnce([message('m1')]);
    stubTracker({ getMessages, markMessagesRead });
    await render(<Probe kind="CHAT" />);
    await flush();
    expect(current()).toMatchObject({ loading: false, error: LOAD_ERROR });
    expect(log).toHaveBeenCalledWith('Failed to load messages', expect.any(Error));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    await flush();
    expect(current().error).toBe(LOAD_ERROR);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    await flush();
    expect(current()).toMatchObject({ messages: [message('m1')], error: null });
    expect(getMessages).toHaveBeenCalledTimes(3);
  });

  it('logs, without showing, a failure to mark the thread read', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubTracker({
      getMessages: () => Promise.resolve([]),
      markMessagesRead: () => Promise.reject(new Error('Offline')),
    });
    await render(<Probe kind="CHAT" />);
    await flush();
    expect(current().error).toBeNull();
    expect(log).toHaveBeenCalledWith('Marking messages read failed', expect.any(Error));
  });

  it('sends a line, then shows the portal’s copy of the thread', async () => {
    const sent = deferred<TrackerMessage>();
    const sendMessage = vi.fn((_body: string) => sent.promise);
    const getMessages = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([message('m2')]);
    stubTracker({ getMessages, markMessagesRead, sendMessage });
    await render(<Probe kind="CHAT" />);
    await flush();

    let sending: Promise<void> = Promise.resolve();
    act(() => {
      sending = current().send('Hello');
    });
    expect(current().sending).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith('Hello');
    await act(async () => {
      sent.resolve(message('m2'));
      await sending;
    });
    expect(current()).toMatchObject({ messages: [message('m2')], sending: false });
  });

  it('rejects a failed send to the caller and stops spinning', async () => {
    stubTracker({
      getMessages: () => Promise.resolve([]),
      markMessagesRead,
      sendMessage: () => Promise.reject(new Error('Not delivered')),
    });
    await render(<Probe kind="CHAT" />);
    await flush();
    await act(async () => {
      await expect(current().send('Hello')).rejects.toThrow('Not delivered');
    });
    expect(current().sending).toBe(false);
  });

  it('stops refreshing and touches nothing once the thread is closed', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const initial = deferred<TrackerMessage[]>();
    const refresh = deferred<TrackerMessage[]>();
    const sent = deferred<TrackerMessage>();
    const getMessages = vi
      .fn()
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(refresh.promise)
      .mockRejectedValue(new Error('closed'));
    stubTracker({ getMessages, markMessagesRead, sendMessage: () => sent.promise });
    await render(<Probe kind="CHAT" />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    let sending: Promise<void> = Promise.resolve();
    act(() => {
      sending = current().send('Bye');
    });
    const before = current();
    unmountAll();

    initial.resolve([message('late')]);
    refresh.reject(new Error('Offline'));
    sent.resolve(message('m3'));
    await expect(sending).rejects.toThrow('closed');
    vi.advanceTimersByTime(30_000);
    await flush();
    expect(getMessages).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenCalledWith('Failed to load messages', expect.any(Error));
    expect(current()).toBe(before);
    expect(before).toMatchObject({ messages: [], loading: true, sending: true });
  });

  it('switches thread when the kind changes', async () => {
    const getMessages = vi.fn((kind: TrackerMessageKind) => Promise.resolve([message('x', kind)]));
    stubTracker({ getMessages, markMessagesRead });
    await render(<Probe kind="CHAT" />);
    await flush();
    await rerender(<Probe kind="NOTICE" />);
    await flush();
    expect(markMessagesRead).toHaveBeenLastCalledWith('NOTICE');
    expect(current().messages).toEqual([message('x', 'NOTICE')]);
  });
});

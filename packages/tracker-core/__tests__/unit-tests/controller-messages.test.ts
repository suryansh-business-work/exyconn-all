import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackerMessage } from '../../src/types';
import { me } from './controller-data';
import { signedIn } from './controller-fixture';

const POLL = 60_000;

function notice(id: string): TrackerMessage {
  return {
    id,
    kind: 'NOTICE',
    direction: 'TO_EMPLOYEE',
    title: `Notice ${id}`,
    body: `Body ${id}`,
    authorName: 'Admin',
    readAt: null,
    createdAt: '2026-02-03T09:00:00.000Z',
  };
}

describe('TrackerController messages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('notifies only about the rise in unread messages', async () => {
    const setup = await signedIn({ unreadMessages: 2 });
    expect(setup.deps.notifier.messages).toHaveBeenCalledWith(2);

    vi.mocked(setup.portal.heartbeat).mockResolvedValue(me({ unreadMessages: 2 }));
    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.deps.notifier.messages).toHaveBeenCalledTimes(1);

    vi.mocked(setup.portal.heartbeat).mockResolvedValue(me({ unreadMessages: 5 }));
    await vi.advanceTimersByTimeAsync(POLL);
    expect(setup.deps.notifier.messages).toHaveBeenLastCalledWith(3);
    expect(setup.latest().unreadMessages).toBe(5);
  });

  it('raises each announcement, then marks them read', async () => {
    const setup = await signedIn({ notices: [notice('n1'), notice('n2')] });

    expect(setup.deps.notifier.notice).toHaveBeenCalledWith('Notice n1', 'Body n1');
    expect(setup.deps.notifier.notice).toHaveBeenCalledWith('Notice n2', 'Body n2');
    expect(setup.portal.markMessagesRead).toHaveBeenCalledWith('NOTICE');
  });

  it('logs a failure to mark announcements read without disturbing anything', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('portal busy');
    const setup = await signedIn();
    vi.mocked(setup.portal.markMessagesRead).mockRejectedValue(cause);
    vi.mocked(setup.portal.heartbeat).mockResolvedValue(me({ notices: [notice('n1')] }));

    await vi.advanceTimersByTimeAsync(POLL);

    expect(error).toHaveBeenCalledWith('Marking announcements as read failed', cause);
    expect(setup.latest().status).toBe('idle');
  });

  it('clears the chat badge at once when the thread is read', async () => {
    const setup = await signedIn({ unreadMessages: 3 });
    vi.mocked(setup.portal.markMessagesRead).mockResolvedValue(3);

    await expect(setup.controller.markMessagesRead('CHAT')).resolves.toBe(3);

    expect(setup.latest().unreadMessages).toBe(0);
  });

  it('does not re-render for a read that changes no badge', async () => {
    const setup = await signedIn({ unreadMessages: 3 });
    const before = setup.states.length;

    await setup.controller.markMessagesRead('NOTICE');
    expect(setup.states.length).toBe(before);
    expect(setup.controller.getState().unreadMessages).toBe(3);

    await setup.controller.markMessagesRead('CHAT');
    const cleared = setup.states.length;
    await setup.controller.markMessagesRead('CHAT');
    expect(setup.states.length).toBe(cleared);
  });
});

describe('TrackerController presence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-03T10:00:00.000Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pauses a running session for lunch and resumes it on return', async () => {
    const setup = await signedIn();
    await setup.controller.start();

    const lunch = await setup.controller.setPresence('LUNCH', 'back at 2');
    expect(lunch).toEqual({ status: 'LUNCH', note: 'back at 2', since: null });
    expect(setup.latest()).toMatchObject({ status: 'paused', presence: lunch });

    await setup.controller.setPresence('WORKING', '');
    expect(setup.latest().status).toBe('tracking');
    await setup.controller.stop();
  });

  it('only records the presence when nothing is running', async () => {
    const setup = await signedIn();

    await setup.controller.setPresence('MEETING', 'client call');
    expect(setup.latest()).toMatchObject({ status: 'idle', presence: { status: 'MEETING' } });

    await setup.controller.setPresence('WORKING', '');
    expect(setup.latest()).toMatchObject({ status: 'idle', presence: { status: 'WORKING' } });
  });
});

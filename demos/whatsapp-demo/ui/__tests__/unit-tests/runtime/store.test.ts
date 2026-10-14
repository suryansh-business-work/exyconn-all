import { describe, expect, it } from 'vitest';
import {
  chatReducer,
  EMPTY_STORE,
  unreadByBusiness,
  type ChatStore,
} from '../../../src/runtime/store';
import { botMessage, chatState, push, userMessage } from './runtime.fixtures';

function withChat(): ChatStore {
  return chatReducer(EMPTY_STORE, {
    type: 'reset',
    demoKey: 'clinic',
    state: chatState(),
    revision: 'r1',
  });
}

describe('chatReducer', () => {
  it('starts a fresh chat on reset, dropping the old transcript but keeping other chats', () => {
    const other = chatReducer(EMPTY_STORE, {
      type: 'reset',
      demoKey: 'salon',
      state: chatState('salon'),
    });
    const used = chatReducer(
      chatReducer(other, { type: 'reset', demoKey: 'clinic', state: chatState() }),
      {
        type: 'append',
        demoKey: 'clinic',
        message: botMessage('m1'),
        unread: true,
      },
    );
    const reset = chatReducer(used, {
      type: 'reset',
      demoKey: 'clinic',
      state: chatState('clinic', 4),
      revision: 'r2',
    });
    expect(reset.chats.clinic).toEqual({
      state: chatState('clinic', 4),
      messages: [],
      unread: 0,
      revision: 'r2',
    });
    expect(reset.chats.salon).toBe(other.chats.salon);
  });

  it.each([
    { type: 'state' as const, demoKey: 'ghost', state: chatState('ghost') },
    { type: 'append' as const, demoKey: 'ghost', message: botMessage('m1'), unread: true },
    { type: 'status' as const, demoKey: 'ghost', id: 'm1', status: 'read' as const },
    { type: 'read' as const, demoKey: 'ghost' },
    { type: 'revision' as const, demoKey: 'ghost', revision: 'r9' },
  ])('leaves the store untouched for a chat that does not exist ($type)', (action) => {
    const store = withChat();
    expect(chatReducer(store, action)).toBe(store);
  });

  it('replaces the engine state', () => {
    const next = chatReducer(withChat(), {
      type: 'state',
      demoKey: 'clinic',
      state: chatState('clinic', 3),
    });
    expect(next.chats.clinic.state.seq).toBe(3);
  });

  it('counts a message as unread only when it arrived away from the chat', () => {
    let store = chatReducer(withChat(), {
      type: 'append',
      demoKey: 'clinic',
      message: botMessage('a'),
      unread: false,
    });
    store = chatReducer(store, {
      type: 'append',
      demoKey: 'clinic',
      message: botMessage('b'),
      unread: true,
    });
    expect(store.chats.clinic.messages.map((m) => m.id)).toEqual(['a', 'b']);
    expect(store.chats.clinic.unread).toBe(1);
  });

  it('keeps only the latest 400 messages of a transcript', () => {
    let store = withChat();
    for (let i = 0; i < 401; i += 1) {
      store = chatReducer(store, {
        type: 'append',
        demoKey: 'clinic',
        message: botMessage(`m${i}`),
        unread: false,
      });
    }
    const ids = store.chats.clinic.messages.map((m) => m.id);
    expect(ids).toHaveLength(400);
    expect(ids[0]).toBe('m1');
    expect(ids.at(-1)).toBe('m400');
  });

  it('moves ticks forward only, treating a message with no status as sent', () => {
    let store = withChat();
    for (const message of [
      userMessage('u1'),
      userMessage('u2', 'read'),
      userMessage('u3', 'sent'),
    ]) {
      store = chatReducer(store, { type: 'append', demoKey: 'clinic', message, unread: false });
    }
    store = chatReducer(store, {
      type: 'status',
      demoKey: 'clinic',
      id: 'u1',
      status: 'delivered',
    });
    store = chatReducer(store, {
      type: 'status',
      demoKey: 'clinic',
      id: 'u2',
      status: 'delivered',
    });
    const statuses = store.chats.clinic.messages.map((m) => m.status);
    expect(statuses).toEqual(['delivered', 'read', 'sent']);
  });

  it('marks a chat as typing per demo', () => {
    const store = chatReducer(withChat(), { type: 'typing', demoKey: 'clinic', typing: true });
    expect(store.typing).toEqual({ clinic: true });
    expect(
      chatReducer(store, { type: 'typing', demoKey: 'clinic', typing: false }).typing.clinic,
    ).toBe(false);
  });

  it('clears the unread count when read, and keeps the same record when nothing was unread', () => {
    const unread = chatReducer(withChat(), {
      type: 'append',
      demoKey: 'clinic',
      message: botMessage('a'),
      unread: true,
    });
    expect(chatReducer(unread, { type: 'read', demoKey: 'clinic' }).chats.clinic.unread).toBe(0);
    const store = withChat();
    expect(chatReducer(store, { type: 'read', demoKey: 'clinic' }).chats.clinic).toBe(
      store.chats.clinic,
    );
  });

  it('records the catalog revision the chat now runs against', () => {
    const store = chatReducer(withChat(), { type: 'revision', demoKey: 'clinic', revision: 'r2' });
    expect(store.chats.clinic.revision).toBe('r2');
  });

  it('schedules pushes and removes them by id or by demo', () => {
    let store = chatReducer(withChat(), {
      type: 'schedule',
      pushes: [push('p1', 10), push('p2', 20), push('p3', 30, 'salon')],
    });
    store = chatReducer(store, { type: 'unschedule', ids: ['p2'] });
    expect(store.pending.map((p) => p.id)).toEqual(['p1', 'p3']);
    store = chatReducer(store, { type: 'unscheduleDemo', demoKey: 'clinic' });
    expect(store.pending.map((p) => p.id)).toEqual(['p3']);
  });
});

describe('unreadByBusiness', () => {
  it("lists the customer's messages that are not yet read", () => {
    const store = [
      botMessage('b'),
      userMessage('u1', 'read'),
      userMessage('u2', 'delivered'),
      userMessage('u3'),
    ].reduce(
      (acc, message) =>
        chatReducer(acc, { type: 'append', demoKey: 'clinic', message, unread: false }),
      withChat(),
    );
    expect(unreadByBusiness(store.chats.clinic).map((m) => m.id)).toEqual(['u2', 'u3']);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadChats, saveChats } from '../../../src/runtime/storage';
import { chatReducer, EMPTY_STORE } from '../../../src/runtime/store';
import { chatState, push } from './runtime.fixtures';

const logger = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));

const KEY = 'exyconn.wa-demo.v1.u-1';

afterEach(() => {
  vi.restoreAllMocks();
  logger.warn.mockReset();
  localStorage.clear();
});

function sampleStore() {
  const store = chatReducer(EMPTY_STORE, { type: 'reset', demoKey: 'clinic', state: chatState() });
  return {
    ...chatReducer(store, { type: 'schedule', pushes: [push('p1', 10)] }),
    typing: { clinic: true },
  };
}

describe('chat storage', () => {
  it('has nothing for a viewer who never chatted', () => {
    expect(loadChats('u-1')).toBeNull();
  });

  it('saves the chats and pending pushes per viewer, never who is typing', () => {
    const store = sampleStore();
    saveChats('u-1', store);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({
      chats: store.chats,
      pending: store.pending,
    });
    expect(loadChats('u-1')).toEqual({ chats: store.chats, pending: store.pending });
    expect(loadChats('u-2')).toBeNull();
  });

  it('starts fresh, with a warning, when the saved chats are unreadable', () => {
    localStorage.setItem(KEY, '{not json');
    expect(loadChats('u-1')).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      'wa-demo: could not read saved chats',
      expect.any(SyntaxError),
    );
  });

  it('starts fresh when storage is blocked', () => {
    const blocked = new Error('blocked');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw blocked;
    });
    expect(loadChats('u-1')).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith('wa-demo: could not read saved chats', blocked);
  });

  it('keeps chatting, with a warning, when a save fails', () => {
    const full = new Error('quota');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw full;
    });
    expect(() => saveChats('u-1', sampleStore())).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith('wa-demo: could not save chats', full);
  });
});

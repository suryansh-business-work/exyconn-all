import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { engineMock } from './engine-mock';
import { clinicIds as ids, mountRuntime as mount } from './runtime-harness';
import * as f from './runtime.fixtures';

vi.mock('@exyconn/wa-flow/engine', async () => (await import('./engine-mock')).engineMock);
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { warn: vi.fn(), error: vi.fn() },
}));

const SAVED_KEY = 'exyconn.wa-demo.v1.u-1';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000);
  engineMock.newChatState.mockImplementation((demoKey) => f.chatState(demoKey));
  engineMock.respond.mockReturnValue(f.result());
});

afterEach(() => {
  vi.useRealTimers();
  engineMock.respond.mockReset();
  engineMock.newChatState.mockReset();
  localStorage.clear();
});

describe('useChatRuntime: the viewer’s saved chats', () => {
  it('picks up a saved chat where it was left and saves changes back', () => {
    const saved = {
      chats: {
        clinic: {
          state: f.chatState('clinic', 5),
          messages: [f.botMessage('old')],
          unread: 2,
          revision: 'r1',
        },
      },
      pending: [],
    };
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    const { rt } = mount({ storageUserId: 'u-1' });
    expect(ids(rt)).toEqual(['old']);
    act(() => rt().open('clinic'));
    expect(engineMock.respond).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '{}').chats.clinic.unread).toBe(0);
  });

  it('runs the saved state on the next message', () => {
    const saved = {
      chats: {
        clinic: { state: f.chatState('clinic', 5), messages: [], unread: 0, revision: 'r1' },
      },
      pending: [],
    };
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    const { rt } = mount({ storageUserId: 'u-1' });
    act(() => rt().send('clinic', 'menu'));
    expect(engineMock.respond.mock.calls[0][1]).toEqual(f.chatState('clinic', 5));
  });

  it('keeps an anonymous preview in memory only', () => {
    const { rt } = mount({ storageUserId: null });
    act(() => rt().open('clinic'));
    expect(localStorage.length).toBe(0);
  });
});

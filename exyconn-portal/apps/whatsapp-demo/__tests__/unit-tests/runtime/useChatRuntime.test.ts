import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { engineMock } from './engine-mock';
import { clinicIds as ids, mountRuntime as mount } from './runtime-harness';
import * as f from './runtime.fixtures';

vi.mock('@exyconn/wa-flow/engine', async () => (await import('./engine-mock')).engineMock);
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { warn: vi.fn(), error: vi.fn() },
}));

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

describe('useChatRuntime: opening chats', () => {
  it('ignores a demo that is not in the catalog', () => {
    const { rt, options } = mount();
    act(() => rt().open('ghost'));
    expect(options.track).not.toHaveBeenCalled();
    expect(engineMock.respond).not.toHaveBeenCalled();
    expect(rt().store.chats).toEqual({});
  });

  it('starts a new chat with the greeting, revealed behind "typing…"', () => {
    engineMock.respond.mockReturnValueOnce(
      f.result({ state: f.chatState('clinic', 1), replies: [f.reply('hello', 100)] }),
    );
    const { rt, options } = mount();
    act(() => rt().open('clinic'));
    expect(options.track).toHaveBeenCalledWith({ type: 'DEMO_OPENED', demoKey: 'clinic' });
    expect(engineMock.newChatState).toHaveBeenCalledWith('clinic', 'u-1');
    expect(engineMock.respond).toHaveBeenCalledWith(
      options.bundles.get('clinic'),
      f.chatState('clinic'),
      { type: 'start' },
      expect.objectContaining({ ai: false }),
    );
    expect(rt().store.chats.clinic).toMatchObject({
      revision: 'r1',
      unread: 0,
      state: f.chatState('clinic', 1),
    });
    expect(rt().store.typing.clinic).toBe(true);
    act(() => vi.advanceTimersByTime(100));
    expect(ids(rt)).toEqual(['hello']);
    expect(rt().store.typing.clinic).toBe(false);
  });

  it('reopens a chat without restarting it and clears its unread count', () => {
    engineMock.respond.mockReturnValueOnce(f.result({ replies: [f.reply('hello', 100)] }));
    const { rt } = mount({ activeKey: 'salon' });
    act(() => rt().open('clinic'));
    act(() => vi.advanceTimersByTime(100));
    expect(rt().store.chats.clinic.unread).toBe(1);
    act(() => rt().open('clinic'));
    expect(engineMock.respond).toHaveBeenCalledTimes(1);
    expect(rt().store.chats.clinic.unread).toBe(0);
    expect(ids(rt)).toEqual(['hello']);
  });

  it('tells the viewer when the business has published new replies since their last visit', () => {
    const { rt, hook, options } = mount();
    act(() => rt().open('clinic'));
    hook.rerender({ ...options, bundles: new Map([['clinic', f.bundle('clinic', 'r2')]]) });
    act(() => rt().open('clinic'));
    const chat = rt().store.chats.clinic;
    expect(chat.revision).toBe('r2');
    expect(chat.messages).toEqual([
      {
        id: 'clinic-rev-r2',
        from: 'bot',
        at: 1000,
        content: {
          type: 'system',
          text: 'T:This business updated its replies since your last visit. Type menu to see what is new.',
        },
      },
    ]);
  });
});

describe('useChatRuntime: what the viewer does', () => {
  it('ignores a message to a chat that was never started', () => {
    const { rt } = mount();
    act(() => rt().send('clinic', 'hi'));
    expect(engineMock.respond).not.toHaveBeenCalled();
  });

  it('shows what the viewer sent, animates its ticks, then reveals the reply', () => {
    const { rt } = mount();
    act(() => rt().open('clinic'));
    engineMock.respond.mockReturnValueOnce(
      f.result({ sent: f.userMessage('u1', 'sent'), replies: [f.reply('r1', 100)] }),
    );
    act(() => rt().send('clinic', 'hi'));
    expect(engineMock.respond.mock.calls[1][2]).toEqual({ type: 'text', text: 'hi' });
    expect(rt().store.chats.clinic.messages[0].status).toBe('sent');
    act(() => vi.advanceTimersByTime(350));
    expect(rt().store.chats.clinic.messages[0].status).toBe('delivered');
    act(() => vi.advanceTimersByTime(300));
    expect(rt().store.chats.clinic.messages[0].status).toBe('read');
    expect(ids(rt)).toEqual(['u1']);
    act(() => vi.advanceTimersByTime(100));
    expect(ids(rt)).toEqual(['u1', 'r1']);
  });

  it('feeds a tapped option to the engine with the message it answered', () => {
    const { rt } = mount();
    act(() => rt().open('clinic'));
    const option = {
      id: 'book',
      title: 'Book',
      ref: { workflow: '$menu', node: '$menu', handle: 'book' },
    };
    act(() => rt().choose('clinic', option, 'Main menu'));
    expect(engineMock.respond.mock.calls[1][2]).toEqual({
      type: 'choice',
      option,
      quoted: 'Main menu',
    });
  });

  it('reports engine signals with the demo key and keeps scheduled reminders', () => {
    engineMock.respond.mockReturnValueOnce(
      f.result({
        signals: [{ type: 'FLOW_STARTED', workflow: 'booking', node: 'n1' }],
        scheduled: [f.push('p1', 99_000)],
      }),
    );
    const { rt, options } = mount();
    act(() => rt().open('clinic'));
    expect(options.track).toHaveBeenCalledWith({
      type: 'FLOW_STARTED',
      workflow: 'booking',
      node: 'n1',
      demoKey: 'clinic',
    });
    expect(rt().store.pending).toEqual([f.push('p1', 99_000)]);
  });

  it('restarts a cleared chat, dropping its reminders and anything still typing', () => {
    engineMock.respond.mockReturnValueOnce(
      f.result({ replies: [f.reply('hello', 100)], scheduled: [f.push('p1', 99_000)] }),
    );
    const { rt, options } = mount();
    act(() => rt().open('clinic'));
    act(() => rt().clear('clinic'));
    expect(options.track).toHaveBeenCalledWith({ type: 'CHAT_CLEARED', demoKey: 'clinic' });
    expect(rt().store.pending).toEqual([]);
    expect(rt().store.typing.clinic).toBe(false);
    expect(engineMock.respond.mock.calls.map((call) => call[2].type)).toEqual(['start', 'start']);
    act(() => vi.advanceTimersByTime(100));
    expect(ids(rt)).toEqual([]);
  });

  it('resets a cleared chat whose demo has left the catalog without running it', () => {
    const { rt } = mount();
    act(() => rt().clear('ghost'));
    expect(rt().store.chats.ghost).toEqual({
      state: f.chatState('ghost'),
      messages: [],
      unread: 0,
      revision: undefined,
    });
    expect(engineMock.respond).not.toHaveBeenCalled();
  });
});

import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { WebsiteChatChannel, WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import { useLiveChatList } from '../../../../../src/pages/chat/sessions/useLiveChatList';
import type { ChatAlertPrefs } from '../../../../../src/pages/chat/alerts/chatAlertPrefs';
import type { ChatConsole } from '../../../../../src/pages/chat/chat.context';
import type { StaffServerFrame } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { ChatConsoleHarness, fakeChatConsole } from './chat-console';
import { chatMessage, sessionRow } from './fixtures';

function wrapperFor(value: ChatConsole) {
  return function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return <ChatConsoleHarness value={value}>{children}</ChatConsoleHarness>;
  };
}

function setup(prefs: Partial<ChatAlertPrefs> = {}) {
  const chat = fakeChatConsole(prefs);
  const reload = vi.fn();
  const hook = renderHook(() => useLiveChatList(reload), { wrapper: wrapperFor(chat.value) });
  const emit = (frame: StaffServerFrame) => {
    act(() => {
      chat.emit(frame);
    });
  };
  const wait = (ms: number) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };
  return { reload, hook, emit, wait };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLiveChatList reloads', () => {
  it('re-reads the list once after a burst of session and message frames', () => {
    const { reload, emit, wait } = setup();
    emit({ t: 'session', session: sessionRow() });
    emit({ t: 'message', message: chatMessage({ sender: WebsiteChatSender.Bot }) });
    wait(499);
    expect(reload).not.toHaveBeenCalled();

    wait(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('ignores frames that do not change the list', () => {
    const { reload, hook, emit, wait } = setup();
    emit({ t: 'pong' });
    emit({ t: 'read', sessionId: 's1', by: 'VISITOR', at: '2026-10-07T09:40:00.000Z' });
    emit({ t: 'typing', sessionId: 's1', who: 'VISITOR', name: 'Asha Rao', on: true });
    wait(1000);
    expect(reload).not.toHaveBeenCalled();
    expect(hook.result.current).toBeNull();
  });

  it('does not reload after the list is gone', () => {
    const { reload, hook, emit, wait } = setup();
    emit({ t: 'session', session: sessionRow() });
    hook.unmount();
    wait(1000);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('useLiveChatList arrival notice', () => {
  it('announces a live visitor message for four seconds', () => {
    const { hook, emit, wait } = setup();
    expect(hook.result.current).toBeNull();

    emit({ t: 'message', message: chatMessage({ id: 'm7', senderName: 'Ravi' }) });
    expect(hook.result.current).toEqual({ id: 'm7', name: 'Ravi' });

    wait(3999);
    expect(hook.result.current).toEqual({ id: 'm7', name: 'Ravi' });
    wait(1);
    expect(hook.result.current).toBeNull();
  });

  it('stays quiet while "animate new messages" is off, but still reloads', () => {
    const { reload, hook, emit, wait } = setup({ animate: false });
    emit({ t: 'message', message: chatMessage() });
    expect(hook.result.current).toBeNull();
    wait(500);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not announce questions to the knowledge bot or messages from the team', () => {
    const { hook, emit } = setup();
    emit({ t: 'message', message: chatMessage({ channel: WebsiteChatChannel.Knowledge }) });
    emit({ t: 'message', message: chatMessage({ sender: WebsiteChatSender.Agent }) });
    expect(hook.result.current).toBeNull();
  });
});

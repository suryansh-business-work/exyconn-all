import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { ChatConsoleContext, type ChatConsole } from '../../../../../src/pages/chat/chat.context';
import {
  DEFAULT_CHAT_ALERT_PREFS,
  type ChatAlertPrefs,
} from '../../../../../src/pages/chat/alerts/chatAlertPrefs';
import type {
  ChatConnection,
  FrameListener,
  StaffServerFrame,
} from '../../../../../src/pages/chat/socket/chatSocket.types';

/** A chat console with no socket behind it; `emit` plays a server frame to every subscriber. */
export interface FakeChatConsole {
  value: ChatConsole;
  emit: (frame: StaffServerFrame) => void;
}

export function fakeChatConsole(
  prefs: Partial<ChatAlertPrefs> = {},
  connection: ChatConnection = 'ready',
): FakeChatConsole {
  const listeners = new Set<FrameListener>();
  const value: ChatConsole = {
    connection,
    send: vi.fn(() => true),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    prefs: { ...DEFAULT_CHAT_ALERT_PREFS, ...prefs },
    setPrefs: vi.fn(),
  };
  return {
    value,
    emit: (frame) => {
      listeners.forEach((listener) => listener(frame));
    },
  };
}

/** Puts a (fake) chat console above the element, the way ChatLayout does. */
export function ChatConsoleHarness({
  value,
  children,
}: Readonly<{ value: ChatConsole; children: ReactNode }>) {
  return <ChatConsoleContext.Provider value={value}>{children}</ChatConsoleContext.Provider>;
}

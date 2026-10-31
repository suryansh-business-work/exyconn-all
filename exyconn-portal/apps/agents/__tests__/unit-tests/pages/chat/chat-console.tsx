import type { ReactElement, ReactNode } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { ChatConsoleContext, type ChatConsole } from '../../../../src/pages/chat/chat.context';
import { DEFAULT_CHAT_ALERT_PREFS } from '../../../../src/pages/chat/alerts/chatAlertPrefs';
import type {
  FrameListener,
  StaffServerFrame,
} from '../../../../src/pages/chat/socket/chatSocket.types';
import { createWrapper, type ProviderOptions } from '../../test-utils';

/** A chat console with spies for `send`/`setPrefs` and a way to push server frames at it. */
export interface FakeConsole extends ChatConsole {
  send: Mock<ChatConsole['send']>;
  setPrefs: Mock<ChatConsole['setPrefs']>;
  /** Delivers a frame to every subscriber, as the socket would, inside act. */
  emit: (frame: StaffServerFrame) => void;
  /** How many listeners are subscribed right now. */
  listenerCount: () => number;
}

export function fakeConsole(overrides: Partial<ChatConsole> = {}): FakeConsole {
  const listeners = new Set<FrameListener>();
  return {
    connection: 'ready',
    prefs: DEFAULT_CHAT_ALERT_PREFS,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    ...overrides,
    send: vi.fn<ChatConsole['send']>(() => true),
    setPrefs: vi.fn<ChatConsole['setPrefs']>(),
    emit: (frame) => {
      act(() => {
        listeners.forEach((listener) => listener(frame));
      });
    },
    listenerCount: () => listeners.size,
  };
}

/** The portal providers with the chat console the ChatLayout would provide, read on every render. */
function consoleWrapper(getConsole: () => ChatConsole, options: Readonly<ProviderOptions>) {
  const Providers = createWrapper(options);
  return function ConsoleProviders({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <Providers>
        <ChatConsoleContext.Provider value={getConsole()}>{children}</ChatConsoleContext.Provider>
      </Providers>
    );
  };
}

/** `render` inside the portal providers and the given chat console. */
export function renderWithConsole(
  ui: ReactElement,
  getConsole: () => ChatConsole,
  options: Readonly<ProviderOptions> = {},
) {
  return render(ui, { wrapper: consoleWrapper(getConsole, options) });
}

/** `renderHook` inside the portal providers and the given chat console. */
export function renderHookWithConsole<Result, Props>(
  hook: (props: Props) => Result,
  getConsole: () => ChatConsole,
  options: Readonly<ProviderOptions & { initialProps?: Props }> = {},
) {
  const { initialProps, ...providers } = options;
  return renderHook(hook, { wrapper: consoleWrapper(getConsole, providers), initialProps });
}

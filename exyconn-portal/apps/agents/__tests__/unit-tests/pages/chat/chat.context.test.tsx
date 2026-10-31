import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatConsole, useChatFrames } from '../../../../src/pages/chat/chat.context';
import type { FrameListener } from '../../../../src/pages/chat/socket/chatSocket.types';
import { fakeConsole, renderHookWithConsole } from './chat-console';

describe('useChatConsole', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refuses to run outside the chat layout', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useChatConsole())).toThrow(
      'useChatConsole must be used inside ChatLayout',
    );
  });

  it('hands over the console the layout provides', () => {
    const chat = fakeConsole({ connection: 'offline' });
    const { result } = renderHookWithConsole(
      () => useChatConsole(),
      () => chat,
    );

    expect(result.current.connection).toBe('offline');
    expect(result.current.send).toBe(chat.send);
  });
});

describe('useChatFrames', () => {
  it('passes every frame to the listener of the latest render', () => {
    const chat = fakeConsole();
    const first = vi.fn<FrameListener>();
    const second = vi.fn<FrameListener>();
    const { rerender } = renderHookWithConsole(
      ({ listener }: { listener: FrameListener }) => useChatFrames(listener),
      () => chat,
      { initialProps: { listener: first } },
    );

    chat.emit({ t: 'ready' });
    rerender({ listener: second });
    chat.emit({ t: 'pong' });

    expect(first.mock.calls).toEqual([[{ t: 'ready' }]]);
    expect(second.mock.calls).toEqual([[{ t: 'pong' }]]);
    expect(chat.listenerCount()).toBe(1);
  });

  it('stops listening when the page goes away', () => {
    const chat = fakeConsole();
    const { unmount } = renderHookWithConsole(
      () => useChatFrames(vi.fn()),
      () => chat,
    );

    expect(chat.listenerCount()).toBe(1);
    unmount();
    expect(chat.listenerCount()).toBe(0);
  });
});

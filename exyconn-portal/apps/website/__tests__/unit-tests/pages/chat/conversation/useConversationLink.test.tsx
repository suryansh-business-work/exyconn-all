import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { WebsiteChatAttachmentKind, WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import {
  useSendReply,
  useWatchConversation,
} from '../../../../../src/pages/chat/conversation/useConversationLink';
import type { ChatSession } from '../../../../../src/pages/chat/socket/chatSocket.types';
import { chatSession } from '../chat-fixtures';
import { fakeConsole, renderHookWithConsole, type FakeConsole } from '../chat-console';

const page = vi.hoisted(() => ({ visible: true, user: null as { name: string } | null }));

vi.mock('../../../../../src/pages/chat/conversation/useDocumentVisible', () => ({
  useDocumentVisible: () => page.visible,
}));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({ useAuth: () => ({ user: page.user }) }));

const UNREAD = chatSession({ staffUnread: 2 });

function watch(chat: { current: FakeConsole }, session: ChatSession | undefined = undefined) {
  return renderHookWithConsole(
    ({ shown }: { shown: ChatSession | undefined }) => useWatchConversation('s1', shown),
    () => chat.current,
    { initialProps: { shown: session } },
  );
}

const frames = (chat: FakeConsole) => chat.send.mock.calls.map(([frame]) => frame);

describe('useWatchConversation', () => {
  beforeEach(() => {
    page.visible = true;
  });

  it('tells the server which chat is open, and that it closed', () => {
    const chat = { current: fakeConsole() };
    const { unmount } = watch(chat);
    expect(frames(chat.current)).toEqual([{ t: 'watch', sessionId: 's1' }]);

    unmount();
    expect(frames(chat.current)).toEqual([
      { t: 'watch', sessionId: 's1' },
      { t: 'watch', sessionId: null },
    ]);
  });

  it('waits for the socket to be ready, and watches again after a reconnect', () => {
    const chat = { current: fakeConsole({ connection: 'offline' }) };
    const { rerender } = watch(chat);
    expect(chat.current.send).not.toHaveBeenCalled();

    chat.current = { ...chat.current, connection: 'ready' };
    rerender({ shown: undefined });
    expect(frames(chat.current)).toEqual([{ t: 'watch', sessionId: 's1' }]);
  });

  it('marks the visitor’s messages read once per change of the chat', () => {
    const chat = { current: fakeConsole() };
    const { rerender } = watch(chat, UNREAD);
    rerender({ shown: { ...UNREAD } });
    rerender({ shown: { ...UNREAD, updatedAt: '2026-10-01T10:09:00.000Z' } });

    expect(frames(chat.current)).toEqual([
      { t: 'watch', sessionId: 's1' },
      { t: 'read', sessionId: 's1' },
      { t: 'read', sessionId: 's1' },
    ]);
  });

  it('tries the read again when the socket could not send it', () => {
    const chat = { current: fakeConsole() };
    chat.current.send.mockReturnValue(false);
    const { rerender } = watch(chat, UNREAD);
    chat.current.send.mockReturnValue(true);
    chat.current = { ...chat.current };
    page.visible = false;
    rerender({ shown: UNREAD });
    page.visible = true;
    rerender({ shown: UNREAD });

    const reads = frames(chat.current).filter((frame) => frame.t === 'read');
    expect(reads).toHaveLength(2);
  });

  it('sends no read while nothing is unread, the tab is hidden or the socket is down', () => {
    const chat = { current: fakeConsole() };
    const { rerender } = watch(chat, chatSession());
    page.visible = false;
    rerender({ shown: UNREAD });
    page.visible = true;
    chat.current = { ...chat.current, connection: 'connecting' };
    rerender({ shown: UNREAD });

    expect(frames(chat.current).some((frame) => frame.t === 'read')).toBe(false);
  });
});

describe('useSendReply', () => {
  const addPending = vi.fn();

  beforeEach(() => {
    addPending.mockReset();
    page.user = { name: 'Ravi' };
  });

  function sendReply(chat: FakeConsole) {
    const { result } = renderHookWithConsole(
      () => useSendReply('s1', addPending),
      () => chat,
    );
    return result.current;
  }

  it('sends the reply and shows it at once under the agent’s name', () => {
    const chat = fakeConsole();
    const files = [{ name: 'a.png', data: 'data:image/png;base64,AAAA' }];

    expect(sendReply(chat)('Thanks!', files)).toBe(true);

    const [frame] = frames(chat);
    expect(frame).toEqual({
      t: 'send',
      sessionId: 's1',
      clientId: expect.any(String),
      body: 'Thanks!',
      files,
    });
    const item = addPending.mock.calls[0][0];
    expect(item.clientId).toBe(frame.t === 'send' ? frame.clientId : '');
    expect(item.failed).toBe(false);
    expect(item.message).toMatchObject({
      id: item.clientId,
      sender: WebsiteChatSender.Agent,
      senderName: 'Ravi',
      body: 'Thanks!',
    });
    expect(item.message.attachments[0].kind).toBe(WebsiteChatAttachmentKind.Image);
  });

  it('gives each reply its own client id', () => {
    const chat = fakeConsole();
    const send = sendReply(chat);
    send('One', []);
    send('Two', []);

    const [first, second] = addPending.mock.calls.map(([item]) => item.clientId);
    expect(first).not.toBe(second);
  });

  it('leaves the name empty when nobody is signed in', () => {
    page.user = null;
    sendReply(fakeConsole())('Hi', []);
    expect(addPending.mock.calls[0][0].message.senderName).toBe('');
  });

  it('keeps the reply in the composer and says why while the socket reconnects', async () => {
    const chat = fakeConsole();
    chat.send.mockReturnValue(false);

    expect(sendReply(chat)('Hello?', [])).toBe(false);
    expect(addPending).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        'The chat is reconnecting, so the message was not sent. Try again in a moment.',
      ),
    ).toBeInTheDocument();
  });
});

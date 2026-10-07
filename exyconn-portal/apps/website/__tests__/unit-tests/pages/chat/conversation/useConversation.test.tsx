import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { WebsiteChatSender } from '@exyconn/shell/graphql/generated';
import { chatMessage, chatSession } from '../chat-fixtures';
import {
  HISTORY,
  SESSION,
  answerQueries,
  pendingReply,
  renderConversation,
} from './conversation-hook';

const gql = vi.hoisted(() => ({ session: vi.fn(), messages: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebsiteChatSessionQuery: (options: unknown) => gql.session(options),
  useWebsiteChatMessagesQuery: (options: unknown) => gql.messages(options),
}));

describe('useConversation', () => {
  beforeEach(() => {
    answerQueries(gql);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the chat and always fetches its history fresh', () => {
    const { current } = renderConversation();

    expect(gql.session).toHaveBeenCalledWith({ variables: { id: 's1' } });
    expect(gql.messages).toHaveBeenCalledWith({
      variables: { sessionId: 's1' },
      fetchPolicy: 'network-only',
    });
    expect(current().session).toBe(SESSION);
    expect(current().messages).toEqual(HISTORY);
    expect(current().loading).toBe(false);
    expect(current().error).toBeUndefined();
  });

  it('is loading while either query is, and reports the first error', () => {
    const failure = new Error('Messages unavailable');
    gql.session.mockReturnValue({ data: undefined, loading: true, error: undefined });
    gql.messages.mockReturnValue({ data: undefined, loading: false, error: failure });
    const { current } = renderConversation();

    expect(current().loading).toBe(true);
    expect(current().error).toBe(failure);
    expect(current().session).toBeUndefined();
    expect(current().messages).toEqual([]);
  });

  it('adds new messages for this chat once each, marking them fresh', () => {
    const { chat, current } = renderConversation();
    const live = chatMessage({ id: 'm2' });

    chat.emit({ t: 'message', message: live });
    chat.emit({ t: 'message', message: live });
    chat.emit({ t: 'message', message: chatMessage({ id: 'other', sessionId: 's2' }) });

    expect(current().messages.map((message) => message.id)).toEqual(['h1', 'm2']);
    expect([...current().freshIds]).toEqual(['m2']);
  });

  it('swaps a pending reply for its echo without animating it again', () => {
    const { chat, current } = renderConversation();
    act(() => current().addPending(pendingReply('c1')));
    expect(current().pending).toHaveLength(1);

    const echo = chatMessage({ id: 'm3', sender: WebsiteChatSender.Agent });
    chat.emit({ t: 'message', message: echo, clientId: 'c1' });
    chat.emit({ t: 'message', message: chatMessage({ id: 'm4' }), clientId: 'elsewhere' });

    expect(current().pending).toEqual([]);
    expect(current().messages.map((message) => message.id)).toEqual(['h1', 'm3', 'm4']);
    expect([...current().freshIds]).toEqual(['m4']);
  });

  it('shows the visitor typing until they send or stop', () => {
    const { chat, current } = renderConversation();
    const typing = { t: 'typing', sessionId: 's1', who: 'VISITOR', name: 'Asha' } as const;

    chat.emit({ ...typing, on: true });
    expect(current().typingName).toBe('Asha');
    chat.emit({ t: 'message', message: chatMessage({ id: 'm5' }) });
    expect(current().typingName).toBeNull();

    chat.emit({ ...typing, on: true });
    chat.emit({ ...typing, on: false });
    expect(current().typingName).toBeNull();
  });

  it('ignores the bot typing, other chats and the team’s own messages', () => {
    const { chat, current } = renderConversation();
    chat.emit({ t: 'typing', sessionId: 's1', who: 'BOT', name: 'Exy', on: true });
    chat.emit({ t: 'typing', sessionId: 's2', who: 'VISITOR', name: 'Bo', on: true });
    expect(current().typingName).toBeNull();

    chat.emit({ t: 'typing', sessionId: 's1', who: 'VISITOR', name: 'Asha', on: true });
    chat.emit({
      t: 'message',
      message: chatMessage({ id: 'm6', sender: WebsiteChatSender.Agent }),
    });
    expect(current().typingName).toBe('Asha');
  });

  it('clears a typing indicator that never got its "stopped" frame', () => {
    vi.useFakeTimers();
    const { chat, current } = renderConversation();
    chat.emit({ t: 'typing', sessionId: 's1', who: 'VISITOR', name: 'Asha', on: true });

    act(() => vi.advanceTimersByTime(7999));
    expect(current().typingName).toBe('Asha');
    act(() => vi.advanceTimersByTime(1));
    expect(current().typingName).toBeNull();
  });

  it('takes the newer session from the socket and ignores other chats', () => {
    const { chat, current } = renderConversation();
    const claimed = chatSession({ assigneeName: 'Ravi', updatedAt: '2026-10-01T11:00:00.000Z' });

    chat.emit({
      t: 'session',
      session: chatSession({ id: 's2', updatedAt: '2026-10-02T00:00:00.000Z' }),
    });
    expect(current().session).toBe(SESSION);
    chat.emit({ t: 'session', session: claimed });
    expect(current().session).toBe(claimed);
  });

  it('shows the team’s replies as seen once the visitor reads them', () => {
    gql.messages.mockReturnValue({
      data: { websiteChatMessages: [chatMessage({ id: 'r1', sender: WebsiteChatSender.Agent })] },
      loading: false,
    });
    const { chat, current } = renderConversation();
    const at = '2026-10-01T10:05:00.000Z';

    chat.emit({ t: 'read', sessionId: 's2', by: 'VISITOR', at });
    expect(current().messages[0].readAt).toBeNull();
    chat.emit({ t: 'read', sessionId: 's1', by: 'VISITOR', at });
    expect(current().messages[0].readAt).toBe(at);
  });
});

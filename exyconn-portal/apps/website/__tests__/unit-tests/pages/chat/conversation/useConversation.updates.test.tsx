import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import {
  WebsiteChatChannel,
  WebsiteChatFeedback,
  WebsiteChatMessagesDocument,
  WebsiteChatSender,
  type WebsiteChatMessagesQuery,
  type WebsiteChatMessagesQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { toCachedMessage } from '../../../../../src/pages/chat/conversation/conversation.messages';
import { chatMessage } from '../chat-fixtures';
import { answerQueries, pendingReply, renderConversation } from './conversation-hook';

const gql = vi.hoisted(() => ({ session: vi.fn(), messages: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useWebsiteChatSessionQuery: (options: unknown) => gql.session(options),
  useWebsiteChatMessagesQuery: (options: unknown) => gql.messages(options),
}));

describe('useConversation refusals and edits', () => {
  beforeEach(() => {
    answerQueries(gql);
  });

  it('shows a refusal and marks the reply it names as not sent', async () => {
    const { chat, current } = renderConversation();
    act(() => {
      current().addPending(pendingReply('c1'));
      current().addPending(pendingReply('c2'));
    });

    chat.emit({ t: 'error', message: 'You are sending too fast', clientId: 'c1' });

    expect(await screen.findByText('You are sending too fast')).toBeInTheDocument();
    expect(current().pending.map((item) => [item.clientId, item.failed])).toEqual([
      ['c1', true],
      ['c2', false],
    ]);
  });

  it('drops a pending reply the agent dismisses', () => {
    const { current } = renderConversation();
    act(() => {
      current().addPending(pendingReply('c1'));
      current().addPending(pendingReply('c2'));
    });
    act(() => current().dismissPending('c1'));

    expect(current().pending.map((item) => item.clientId)).toEqual(['c2']);
  });

  it('swaps a rated bot answer in the cached history and on screen', () => {
    const answer = chatMessage({
      id: 'b1',
      channel: WebsiteChatChannel.Knowledge,
      sender: WebsiteChatSender.Bot,
    });
    const earlier = chatMessage({ id: 'b0' });
    const { chat, current, client } = renderConversation();
    const query = { query: WebsiteChatMessagesDocument, variables: { sessionId: 's1' } };
    client().cache.writeQuery<WebsiteChatMessagesQuery, WebsiteChatMessagesQueryVariables>({
      ...query,
      data: { websiteChatMessages: [toCachedMessage(earlier), toCachedMessage(answer)] },
    });
    chat.emit({ t: 'message', message: earlier });
    chat.emit({ t: 'message', message: answer });

    chat.emit({ t: 'messageUpdated', message: { ...answer, feedback: WebsiteChatFeedback.Up } });

    const cached = client().cache.readQuery<WebsiteChatMessagesQuery>(query);
    expect(cached?.websiteChatMessages.map((message) => message.id)).toEqual(['b0', 'b1']);
    expect(cached?.websiteChatMessages[0].feedback).toBe(earlier.feedback);
    expect(cached?.websiteChatMessages[1].feedback).toBe(WebsiteChatFeedback.Up);
    expect(current().messages.find((message) => message.id === 'b0')?.feedback).toBe(
      earlier.feedback,
    );
    const shown = current().messages.find((message) => message.id === 'b1');
    expect(shown?.feedback).toBe(WebsiteChatFeedback.Up);
  });

  it('leaves this chat alone when another chat’s message changes', () => {
    const { chat, current } = renderConversation();
    chat.emit({ t: 'message', message: chatMessage({ id: 'm7' }) });
    chat.emit({
      t: 'messageUpdated',
      message: chatMessage({ id: 'm7', sessionId: 's2', body: 'X' }),
    });
    chat.emit({ t: 'pong' });

    expect(current().messages.find((message) => message.id === 'm7')?.body).toBe('Hello');
  });
});

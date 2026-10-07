import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { WebsiteChatChannel } from '@exyconn/shell/graphql/generated';
import { useThreadUnread } from '../../../../../src/pages/chat/conversation/useThreadUnread';
import type {
  ChatMessage,
  ChatSession,
} from '../../../../../src/pages/chat/socket/chatSocket.types';
import { chatMessage, chatSession } from '../chat-fixtures';

const { Live, Knowledge } = WebsiteChatChannel;

interface Props {
  messages: ChatMessage[];
  session: ChatSession;
  active: WebsiteChatChannel;
}

const live = (id: string) => chatMessage({ id, channel: Live });
const knowledge = (id: string) => chatMessage({ id, channel: Knowledge });

function renderUnread(initialProps: Props) {
  return renderHook(
    ({ messages, session, active }: Props) => useThreadUnread(messages, session, active),
    { initialProps },
  );
}

describe('useThreadUnread', () => {
  it('shows no dot on the open thread, nor on threads with nothing new', () => {
    const { result } = renderUnread({
      messages: [live('a'), knowledge('b')],
      session: chatSession(),
      active: Live,
    });

    expect(result.current(Live)).toBe(false);
    expect(result.current(Knowledge)).toBe(false);
  });

  it('dots a background thread that gained messages until it is opened', () => {
    const session = chatSession();
    const { result, rerender } = renderUnread({ messages: [live('a')], session, active: Live });

    rerender({ messages: [live('a'), knowledge('b')], session, active: Live });
    expect(result.current(Knowledge)).toBe(true);

    rerender({ messages: [live('a'), knowledge('b')], session, active: Knowledge });
    expect(result.current(Knowledge)).toBe(false);

    rerender({ messages: [live('a'), knowledge('b')], session, active: Live });
    expect(result.current(Knowledge)).toBe(false);
  });

  it('dots the live thread while the visitor waits for the team', () => {
    const { result } = renderUnread({
      messages: [live('a')],
      session: chatSession({ staffUnread: 1 }),
      active: Knowledge,
    });

    expect(result.current(Live)).toBe(true);
  });

  it('dots the live thread when it grows behind the knowledge thread', () => {
    const session = chatSession();
    const { result, rerender } = renderUnread({ messages: [], session, active: Knowledge });
    expect(result.current(Live)).toBe(false);

    rerender({ messages: [live('a')], session, active: Knowledge });
    expect(result.current(Live)).toBe(true);
  });

  it('does not count an unread visitor against the knowledge thread', () => {
    const { result } = renderUnread({
      messages: [],
      session: chatSession({ staffUnread: 3 }),
      active: Live,
    });

    expect(result.current(Knowledge)).toBe(false);
  });
});

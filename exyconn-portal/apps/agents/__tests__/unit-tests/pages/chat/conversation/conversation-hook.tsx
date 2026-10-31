import type { Mock } from 'vitest';
import { useApolloClient } from '@apollo/client/react';
import { useConversation } from '../../../../../src/pages/chat/conversation/useConversation';
import { optimisticMessage } from '../../../../../src/pages/chat/conversation/conversation.messages';
import { chatMessage, chatSession } from '../chat-fixtures';
import { fakeConsole, renderHookWithConsole } from '../chat-console';

export const SESSION = chatSession();
export const HISTORY = [chatMessage({ id: 'h1', createdAt: '2026-10-01T09:59:30.000Z' })];

/** Makes the mocked session and history queries answer with SESSION and HISTORY. */
export function answerQueries(gql: Readonly<{ session: Mock; messages: Mock }>) {
  gql.session.mockReset().mockReturnValue({
    data: { websiteChatSession: SESSION },
    loading: false,
    error: undefined,
  });
  gql.messages.mockReset().mockReturnValue({
    data: { websiteChatMessages: HISTORY },
    loading: false,
    error: undefined,
  });
}

/** useConversation('s1') on a fake chat socket, with the Apollo client it writes to. */
export function renderConversation() {
  const chat = fakeConsole();
  const hook = renderHookWithConsole(
    () => ({ conversation: useConversation('s1'), client: useApolloClient() }),
    () => chat,
  );
  return {
    chat,
    current: () => hook.result.current.conversation,
    client: () => hook.result.current.client,
  };
}

/** An agent reply waiting for the server's echo. */
export const pendingReply = (clientId: string) => ({
  clientId,
  failed: false,
  message: optimisticMessage({
    clientId,
    sessionId: 's1',
    senderName: 'Ravi',
    body: 'Hi',
    files: [],
  }),
});

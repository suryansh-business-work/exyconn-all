import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  WebsiteChatSender,
  useWebsiteChatMessagesQuery,
  useWebsiteChatSessionQuery,
} from '@exyconn/shell/graphql/generated';
import { useChatFrames } from '../chat.context';
import type { ChatMessage, ChatSession } from '../socket/chatSocket.types';
import {
  mergeMessages,
  newerSession,
  withVisitorRead,
  type PendingMessage,
} from './conversation.messages';

/** A typing indicator with no "stopped" frame (a closed laptop) clears itself after this. */
const TYPING_TIMEOUT_MS = 8000;

/**
 * One conversation, live: the history from GraphQL, then every message, session change,
 * typing and read frame for this chat from the socket. Replies waiting for their echo are
 * kept in `pending` until the server sends them back.
 */
export function useConversation(sessionId: string) {
  const notify = useNotify();
  const sessionQuery = useWebsiteChatSessionQuery({ variables: { id: sessionId } });
  const messagesQuery = useWebsiteChatMessagesQuery({
    variables: { sessionId },
    fetchPolicy: 'network-only',
  });
  const [live, setLive] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [socketSession, setSocketSession] = useState<ChatSession | null>(null);
  const [visitorReadAt, setVisitorReadAt] = useState<string | null>(null);
  const [typingName, setTypingName] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    if (!typingName) {
      return undefined;
    }
    const timer = setTimeout(() => setTypingName(null), TYPING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [typingName]);

  const receive = (message: ChatMessage, clientId?: string) => {
    setLive((previous) =>
      previous.some((known) => known.id === message.id) ? previous : [...previous, message],
    );
    // The echo of a reply already on screen replaces its bubble without animating again.
    if (clientId && pending.some((item) => item.clientId === clientId)) {
      setPending((previous) => previous.filter((item) => item.clientId !== clientId));
    } else {
      setFreshIds((previous) => new Set(previous).add(message.id));
    }
    if (message.sender === WebsiteChatSender.Visitor) {
      setTypingName(null);
    }
  };

  /** Shows the refusal; when it names one of this page's replies, marks that reply failed. */
  const refuse = (reason: string, clientId?: string) => {
    notify(reason, 'error');
    setPending((previous) =>
      previous.map((item) => (item.clientId === clientId ? { ...item, failed: true } : item)),
    );
  };

  useChatFrames((frame) => {
    switch (frame.t) {
      case 'message':
        if (frame.message.sessionId === sessionId) {
          receive(frame.message, frame.clientId);
        }
        return;
      case 'session':
        if (frame.session.id === sessionId) {
          setSocketSession(frame.session);
        }
        return;
      case 'typing':
        if (frame.sessionId === sessionId) {
          setTypingName(frame.on ? frame.name : null);
        }
        return;
      case 'read':
        if (frame.sessionId === sessionId) {
          setVisitorReadAt(frame.at);
        }
        return;
      case 'error':
        refuse(frame.message, frame.clientId);
        return;
      default:
    }
  });

  const history = messagesQuery.data?.websiteChatMessages;
  const messages = useMemo(
    () => withVisitorRead(mergeMessages(history ?? [], live), visitorReadAt),
    [history, live, visitorReadAt],
  );
  const addPending = useCallback(
    (item: PendingMessage) => setPending((previous) => [...previous, item]),
    [],
  );
  const dismissPending = useCallback(
    (clientId: string) =>
      setPending((previous) => previous.filter((item) => item.clientId !== clientId)),
    [],
  );

  return {
    session: newerSession(sessionQuery.data?.websiteChatSession, socketSession),
    messages,
    freshIds,
    pending,
    addPending,
    dismissPending,
    typingName,
    loading: sessionQuery.loading || messagesQuery.loading,
    error: sessionQuery.error ?? messagesQuery.error,
  };
}

export type Conversation = ReturnType<typeof useConversation>;

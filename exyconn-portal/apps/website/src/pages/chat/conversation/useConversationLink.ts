import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useChatConsole } from '../chat.context';
import type { ChatFileFrame, ChatSession } from '../socket/chatSocket.types';
import { optimisticMessage, type PendingMessage } from './conversation.messages';
import { useDocumentVisible } from './useDocumentVisible';

/**
 * Tells the server which chat is on screen (so it forwards the visitor's typing and reads),
 * and marks the visitor's messages read whenever new ones arrive while the tab is visible.
 * The watch is sent again after every reconnect.
 */
export function useWatchConversation(sessionId: string, session: ChatSession | undefined): void {
  const { send, connection } = useChatConsole();
  const visible = useDocumentVisible();
  const readSentFor = useRef<string | null>(null);

  useEffect(() => {
    if (connection !== 'ready') {
      return undefined;
    }
    send({ t: 'watch', sessionId });
    return () => {
      send({ t: 'watch', sessionId: null });
    };
  }, [connection, send, sessionId]);

  // Each change to the session (a new visitor message bumps it) is read at most once.
  const unreadVersion = session && session.staffUnread > 0 ? session.updatedAt : null;
  useEffect(() => {
    if (!unreadVersion || !visible || connection !== 'ready') {
      return;
    }
    if (readSentFor.current !== unreadVersion && send({ t: 'read', sessionId })) {
      readSentFor.current = unreadVersion;
    }
  }, [unreadVersion, visible, connection, send, sessionId]);
}

/**
 * Sends an agent reply over the socket and shows it at once, keyed by a client id the
 * server's echo carries back. False when the socket is down, so the composer keeps the text.
 */
export function useSendReply(
  sessionId: string,
  addPending: (item: PendingMessage) => void,
): (body: string, files: ChatFileFrame[]) => boolean {
  const { send } = useChatConsole();
  const { user } = useAuth();
  const notify = useNotify();

  return useCallback(
    (body: string, files: ChatFileFrame[]) => {
      const clientId = globalThis.crypto.randomUUID();
      if (!send({ t: 'send', sessionId, clientId, body, files })) {
        notify(
          'The chat is reconnecting, so the message was not sent. Try again in a moment.',
          'error',
        );
        return false;
      }
      const senderName = user?.name ?? '';
      addPending({
        clientId,
        failed: false,
        message: optimisticMessage({ clientId, sessionId, senderName, body, files }),
      });
      return true;
    },
    [send, sessionId, addPending, notify, user],
  );
}

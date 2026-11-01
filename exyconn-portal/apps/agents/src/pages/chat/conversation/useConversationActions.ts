import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useClaimWebsiteChatSessionMutation,
  useDeleteWebsiteChatSessionMutation,
} from '@exyconn/shell/graphql/generated';
import { CHAT_PATHS } from '../chat.routes';
import { useCloseChat } from '../useCloseChat';
import type { ChatMessage, ChatSession } from '../socket/chatSocket.types';
import { downloadText, transcriptText } from './transcript';

/** Claim, close, download and delete for the conversation page's header. */
export function useConversationActions(session: ChatSession, messages: readonly ChatMessage[]) {
  const t = useT();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDateTime } = useSettings();
  const [claimSession, { loading: claiming }] = useClaimWebsiteChatSessionMutation();
  const [deleteSession] = useDeleteWebsiteChatSessionMutation();
  // The socket's session frame brings the closed status in; nothing else to refresh.
  const close = useCloseChat(() => undefined);

  const claim = () => {
    claimSession({ variables: { id: session.id } })
      .then(() => notify('The chat is yours to answer', 'success'))
      .catch((error: unknown) => notify(errorMessage(error, 'Could not claim the chat'), 'error'));
  };

  const download = () => {
    const name = session.ticketReference || session.id;
    downloadText(`chat-${name}.txt`, transcriptText(session, messages, formatDateTime, t));
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete chat',
      message: 'Delete the chat with {name} and every message in it? This cannot be undone.',
      messageValues: { name: session.name },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    await deleteSession({ variables: { id: session.id } });
    notify('Chat deleted', 'success');
    navigate(CHAT_PATHS.sessions);
  };

  return {
    claim,
    claiming,
    close: () => close(session),
    download,
    remove: () => {
      remove().catch((error: unknown) =>
        notify(errorMessage(error, 'Could not delete the chat'), 'error'),
      );
    },
  };
}

import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCloseWebsiteChatSessionMutation } from '@exyconn/shell/graphql/generated';

/**
 * Confirms, then ends a chat. The visitor sees it closed at once and, when the settings say so,
 * is emailed the conversation. Shared by the chat list's row action and the conversation page.
 */
export function useCloseChat(onClosed: () => void): (chat: { id: string; name: string }) => void {
  const confirm = useConfirm();
  const notify = useNotify();
  const [closeSession] = useCloseWebsiteChatSessionMutation();

  const close = async (chat: { id: string; name: string }) => {
    const ok = await confirm({
      title: 'Close chat',
      message: 'End the chat with {name}? They can start a new one from the widget.',
      messageValues: { name: chat.name },
      confirmText: 'Close chat',
    });
    if (!ok) {
      return;
    }
    await closeSession({ variables: { id: chat.id } });
    notify('Chat closed', 'success');
    onClosed();
  };

  return (chat) => {
    close(chat).catch((error: unknown) =>
      notify(errorMessage(error, 'Could not close the chat'), 'error'),
    );
  };
}

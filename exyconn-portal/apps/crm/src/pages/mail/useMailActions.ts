import {
  CrmMailAction,
  CrmMailOverviewDocument,
  CrmMailThreadsDocument,
  useCrmMailThreadActionMutation,
} from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { OpenThread } from './useMailRoute';

/** What a person is told once an action went through. */
const DONE: Readonly<Record<CrmMailAction, string>> = {
  [CrmMailAction.MarkRead]: 'Marked as read',
  [CrmMailAction.MarkUnread]: 'Marked as unread',
  [CrmMailAction.Star]: 'Starred',
  [CrmMailAction.Unstar]: 'Star removed',
  [CrmMailAction.Archive]: 'Archived',
  [CrmMailAction.Trash]: 'Moved to trash',
};

/**
 * Marks, stars, archives and trashes conversations in Gmail, then re-reads the list and the
 * counts. Trash asks first. `quiet` skips the confirmation message (marking a conversation
 * read as it opens). Resolves whether the action went through.
 */
export function useMailActions() {
  const confirm = useConfirm();
  const notify = useNotify();
  const [apply, { loading }] = useCrmMailThreadActionMutation({
    refetchQueries: [CrmMailOverviewDocument, CrmMailThreadsDocument],
  });

  const run = async (threads: OpenThread[], action: CrmMailAction, quiet = false) => {
    if (action === CrmMailAction.Trash) {
      const sure = await confirm({
        title: 'Move to trash?',
        message:
          "Move {count} conversation(s) to Gmail's trash? Gmail deletes them for good after 30 days.",
        messageValues: { count: threads.length },
        confirmText: 'Move to trash',
        destructive: true,
      });
      if (!sure) {
        return false;
      }
    }
    try {
      await apply({ variables: { threads, action } });
      if (!quiet) {
        notify(DONE[action], 'success');
      }
      return true;
    } catch (error) {
      portalLogger.warn('crm: changing mail failed', { action, error });
      notify(errorMessage(error, 'The conversation could not be changed.'), 'error');
      return false;
    }
  };

  return { run, busy: loading };
}

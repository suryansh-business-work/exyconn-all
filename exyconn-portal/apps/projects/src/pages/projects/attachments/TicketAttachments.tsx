import { Box, Divider, Text } from '@exyconn/shell/components/ui';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useUpdateTaskMutation,
  type TaskAttachmentFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { AttachmentList, type AttachmentView } from './AttachmentList';
import { AttachmentPicker } from './AttachmentPicker';
import type { PickedAttachment } from './useAttachmentUpload';

interface TicketAttachmentsProps {
  taskId: string;
  /** The ticket's summary, resent unchanged because the mutation's input requires it. */
  title: string;
  files: readonly TaskAttachmentFieldsFragment[];
  /** Called after a save, so the board and the dialog re-read the ticket. */
  onChanged: () => void;
}

const toInput = (file: AttachmentView | PickedAttachment) => ({
  url: file.url,
  name: file.name,
  contentType: file.contentType,
});

/**
 * The files on a ticket.
 *
 * Adding and removing save straight away rather than waiting for the ticket form's Save:
 * the trail records who attached what and when, and a file that only existed until somebody
 * pressed Cancel would make that record wrong. The mutation resends the summary because the
 * input requires it; every other ticket field is left untouched.
 */
export function TicketAttachments({
  taskId,
  title,
  files,
  onChanged,
}: Readonly<TicketAttachmentsProps>) {
  const confirm = useConfirm();
  const notify = useNotify();
  const [updateTask] = useUpdateTaskMutation();

  const save = async (next: Array<ReturnType<typeof toInput>>, done: string) => {
    try {
      await updateTask({ variables: { id: taskId, input: { title, attachments: next } } });
      notify(done);
      onChanged();
    } catch (error) {
      notify(errorMessage(error, 'Could not save the attachment'), 'error');
    }
  };

  const add = (picked: PickedAttachment) =>
    save([...files.map(toInput), toInput(picked)], 'Attachment added');

  const remove = async (file: AttachmentView) => {
    const ok = await confirm({
      message: `Remove "${file.name}" from this ticket?`,
      confirmText: 'Remove',
    });
    if (ok) {
      await save(files.filter((one) => one.url !== file.url).map(toInput), 'Attachment removed');
    }
  };

  return (
    <Box>
      <Text size="label" sx={{ mb: 1 }}>
        Attachments ({files.length})
      </Text>
      <Divider sx={{ mb: 1.5 }} />
      <AttachmentList files={files} onRemove={remove} emptyText="Nothing attached yet." />
      <Box sx={{ mt: 1.5 }}>
        <AttachmentPicker onPicked={add} />
      </Box>
    </Box>
  );
}

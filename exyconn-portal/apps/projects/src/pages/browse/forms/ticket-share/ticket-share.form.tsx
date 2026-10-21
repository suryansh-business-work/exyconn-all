import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { RhfMultiSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useShareTaskMutation } from '@exyconn/shell/graphql/generated';
import type { TicketShareRecipient, TicketShareValues } from './ticket-share.types';

/** The server refuses more than this; the form says so before anything is sent. */
const MAX_RECIPIENTS = 50;
const MAX_NOTE = 500;

const schema = z.object({
  recipientIds: z
    .array(z.string())
    .min(1, 'Choose at least one person')
    .max(MAX_RECIPIENTS, `Share with at most ${MAX_RECIPIENTS} people at a time`),
  note: z.string().trim().max(MAX_NOTE, `Keep the note under ${MAX_NOTE} characters`),
});

interface TicketShareFormProps {
  taskId: string;
  recipients: TicketShareRecipient[];
  onShared: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form that sends a ticket to the people chosen, as a notification. */
export function TicketShareForm({
  taskId,
  recipients,
  onShared,
  onCancel,
}: Readonly<TicketShareFormProps>) {
  const notify = useNotify();
  const [shareTask] = useShareTaskMutation();
  const methods = useForm<z.input<typeof schema>, unknown, TicketShareValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { recipientIds: [], note: '' },
  });

  const onSubmit = async (values: TicketShareValues) => {
    try {
      const { data } = await shareTask({
        variables: { id: taskId, recipientIds: values.recipientIds, note: values.note },
      });
      notify('Shared with {count} people', 'success', { count: data?.shareTask ?? 0 });
      onShared();
    } catch (error) {
      notify(errorMessage(error, 'Could not share the ticket'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Share"
    >
      <RhfMultiSelect
        name="recipientIds"
        label="People"
        options={recipients}
        helperText="They get a notification with a link to this ticket"
      />
      <RhfTextField
        name="note"
        label="Note"
        helperText="Optional — a line of context for them"
        multiline
        minRows={2}
      />
    </EntityForm>
  );
}

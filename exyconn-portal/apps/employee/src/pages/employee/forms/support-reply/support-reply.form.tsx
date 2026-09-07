import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useAddMySupportReplyMutation } from '@exyconn/shell/graphql/generated';
import type { SupportReplyFormValues } from './support-reply.types';

const schema = z.object({
  body: z.string().trim().min(1, 'Reply is required').max(4000, 'Keep it under 4000 characters'),
});

const INITIAL: SupportReplyFormValues = { body: '' };

interface SupportReplyFormProps {
  ticketId: string;
  onCancel: () => void;
  onDone: () => void;
}

/** React Hook Form + Zod form for an employee to continue the conversation on their ticket. */
export function SupportReplyForm({ ticketId, onCancel, onDone }: Readonly<SupportReplyFormProps>) {
  const notify = useNotify();
  const [addReply] = useAddMySupportReplyMutation();
  const methods = useForm<SupportReplyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: INITIAL,
  });

  const onSubmit = async (values: SupportReplyFormValues) => {
    try {
      await addReply({ variables: { ticketId, body: values.body } });
      notify('Reply sent');
      methods.reset();
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not send the reply', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send reply"
    >
      <RhfTextField name="body" label="Your reply" multiline minRows={3} />
    </EntityForm>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useAddSupportReplyMutation } from '@exyconn/shell/graphql/generated';

const VISIBILITY_OPTIONS: SelectOption[] = [
  { value: 'false', label: 'Reply to the employee' },
  { value: 'true', label: 'Internal note (team only)' },
];

const schema = z.object({
  body: z.string().trim().min(1, 'Write something before sending'),
  internal: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

interface SupportReplyFormProps {
  ticketId: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to answer a ticket. The visibility choice is
 * deliberately explicit rather than a checkbox tucked away: an internal note
 * posted as a reply is the mistake that is hard to take back.
 */
export function SupportReplyForm({ ticketId, onDone, onCancel }: Readonly<SupportReplyFormProps>) {
  const notify = useNotify();
  const [addReply] = useAddSupportReplyMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { body: '', internal: 'false' },
  });

  const onSubmit = async ({ body, internal }: Values) => {
    try {
      await addReply({ variables: { ticketId, body, internal: internal === 'true' } });
      notify(internal === 'true' ? 'Internal note added' : 'Reply sent');
      methods.reset({ body: '', internal });
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not send', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send"
    >
      <RhfSelect name="internal" label="Visibility" options={VISIBILITY_OPTIONS} />
      <RhfTextField name="body" label="Message" multiline rows={4} />
    </EntityForm>
  );
}

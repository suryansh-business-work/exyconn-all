import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useEscalateSupportTicketMutation } from '@/graphql/generated';
import { errorMessage } from '@/utils/errorMessage';
import type { TicketEscalateValues } from './ticket-escalate.types';

/** Long enough for the person picking it up to act on, short enough to stay a note. */
const REASON_MAX = 500;

export const ticketEscalateSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Say why it needs escalating')
    .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
});

interface TicketEscalateFormProps {
  ticketId: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to escalate a ticket. Escalating raises it to HIGH priority and
 * tells whoever holds it, so the reason is required — it is the first thing they will read.
 */
export function TicketEscalateForm({
  ticketId,
  onDone,
  onCancel,
}: Readonly<TicketEscalateFormProps>) {
  const notify = useNotify();
  const [escalate] = useEscalateSupportTicketMutation();
  const methods = useForm<TicketEscalateValues>({
    resolver: zodResolver(ticketEscalateSchema),
    defaultValues: { reason: '' },
  });

  const onSubmit = async ({ reason }: TicketEscalateValues) => {
    try {
      await escalate({ variables: { id: ticketId, reason } });
      notify('Ticket escalated');
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not escalate the ticket'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Escalate"
    >
      <RhfTextField
        name="reason"
        label="Why does it need escalating?"
        helperText="Saved on the thread as an internal note and sent to the assignee"
        multiline
        rows={3}
      />
    </EntityForm>
  );
}

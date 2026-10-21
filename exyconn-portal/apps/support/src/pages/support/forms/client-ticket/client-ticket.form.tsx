import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  SupportCategory,
  SupportPriority,
  useCreateClientSupportTicketMutation,
} from '@exyconn/shell/graphql/generated';
import { CLIENT_TICKET_LIMITS } from './client-ticket.types';

const { name, subject, description } = CLIENT_TICKET_LIMITS;

const schema = z.object({
  requesterName: z
    .string()
    .trim()
    .min(name.min, 'Give the customer’s name')
    .max(name.max, `At most ${name.max} characters`),
  requesterEmail: z.string().trim().regex(EMAIL, 'Enter a valid email address'),
  subject: z
    .string()
    .trim()
    .min(subject.min, 'Add a short subject')
    .max(subject.max, `At most ${subject.max} characters`),
  category: z.enum(SupportCategory),
  description: z
    .string()
    .trim()
    .min(description.min, 'Describe the issue in a bit more detail')
    .max(description.max, `At most ${description.max} characters`),
  priority: z.enum(SupportPriority),
});
type Values = z.infer<typeof schema>;

const INITIAL: Values = {
  requesterName: '',
  requesterEmail: '',
  subject: '',
  category: SupportCategory.Other,
  description: '',
  priority: SupportPriority.Medium,
};

interface ClientTicketFormProps {
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Files a ticket for a customer who wrote in or phoned. It goes through the same
 * unauthenticated mutation the public form uses, so the address is matched against the
 * client book and a reference is issued the same way — an agent typing it in must not
 * produce a different kind of ticket from one the customer raised themselves.
 */
export function ClientTicketForm({ onCancel, onDone }: Readonly<ClientTicketFormProps>) {
  const notify = useNotify();
  const [createTicket] = useCreateClientSupportTicketMutation();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: INITIAL,
  });

  const onSubmit = async (values: Values) => {
    try {
      const { data } = await createTicket({ variables: { input: values } });
      notify('Ticket {reference} raised', 'success', {
        reference: data?.createClientSupportTicket ?? '',
      });
      methods.reset(INITIAL);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not raise the ticket', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Raise ticket"
    >
      <RhfTextField
        name="requesterName"
        label="Customer name"
        helperText="The customer's name as they gave it, 2 to 80 characters."
      />
      <RhfTextField
        name="requesterEmail"
        label="Customer email"
        helperText="Matched against the client book; replies go to this address."
      />
      <RhfTextField
        name="subject"
        label="Subject"
        helperText="A short summary of the issue, 5 to 120 characters."
      />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(SupportCategory))}
        helperText="The area the issue belongs to, e.g. IT or Payroll."
      />
      <RhfSelect
        name="priority"
        label="Priority"
        options={enumOptions(Object.values(SupportPriority))}
        helperText="How urgent it is; it decides which SLA targets apply."
      />
      <RhfTextField
        name="description"
        label="Description"
        multiline
        minRows={3}
        helperText="What happened and what they need, 20 to 4000 characters."
      />
    </EntityForm>
  );
}

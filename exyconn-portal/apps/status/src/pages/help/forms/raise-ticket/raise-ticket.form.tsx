import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SupportCategory,
  SupportPriority,
  useCreateClientSupportTicketMutation,
} from '@exyconn/shell/graphql/generated';
import { RAISE_TICKET_DEFAULTS, raiseTicketSchema } from './raise-ticket.schema';
import type { RaiseTicketFormProps } from './raise-ticket.types';

const CATEGORY_OPTIONS = enumOptions(Object.values(SupportCategory));
const PRIORITY_OPTIONS = enumOptions(Object.values(SupportPriority));

type Values = z.infer<typeof raiseTicketSchema>;

/**
 * The public "ask for help" form.
 *
 * Until this existed a customer could only reach support by emailing the mailbox or by
 * having an agent type the ticket in for them — the mutation behind it has been
 * unauthenticated and rate-limited since the customer queue was built, and nothing on the
 * internet called it.
 *
 * The answer is the reference and nothing else: a stranger who guesses an address must not
 * learn anything about the tickets on it.
 */
export function RaiseTicketForm({ onSubmitted, onCancel }: Readonly<RaiseTicketFormProps>) {
  const notify = useNotify();
  const [raise] = useCreateClientSupportTicketMutation();
  const methods = useForm<z.input<typeof raiseTicketSchema>, unknown, Values>({
    resolver: zodResolver(raiseTicketSchema),
    defaultValues: RAISE_TICKET_DEFAULTS,
  });

  const onSubmit = async (values: Values) => {
    try {
      const { data } = await raise({ variables: { input: values } });
      methods.reset(RAISE_TICKET_DEFAULTS);
      onSubmitted(data?.createClientSupportTicket ?? '');
    } catch (error) {
      notify(errorMessage(error, 'Could not raise the ticket'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Ask for help"
    >
      <RhfTextField name="requesterName" label="Your name" />
      <RhfTextField
        name="requesterEmail"
        label="Your email"
        helperText="Where we reply, and how you follow the ticket later"
      />
      <RhfSelect name="category" label="What is it about?" options={CATEGORY_OPTIONS} />
      <RhfSelect name="priority" label="How urgent is it?" options={PRIORITY_OPTIONS} />
      <RhfTextField name="subject" label="Title" helperText="One line we can scan quickly" />
      <RhfTextField
        name="description"
        label="What is happening?"
        multiline
        rows={5}
        helperText="What you expected, what happened instead, and anything you have already tried"
      />
    </EntityForm>
  );
}

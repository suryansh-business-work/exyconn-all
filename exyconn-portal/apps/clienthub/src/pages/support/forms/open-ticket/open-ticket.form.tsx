import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SupportCategory,
  SupportPriority,
  useClientHubOpenTicketMutation,
} from '@exyconn/shell/graphql/generated';
import { OPEN_TICKET_DEFAULTS, openTicketSchema, type OpenTicketValues } from './open-ticket.types';

const CATEGORY_OPTIONS = enumOptions(Object.values(SupportCategory));
const PRIORITY_OPTIONS = enumOptions(Object.values(SupportPriority));

interface OpenTicketFormProps {
  onDone: () => void;
  onCancel: () => void;
}

/** Raises a support ticket for the client; replies arrive here and by email. */
export function OpenTicketForm({ onDone, onCancel }: Readonly<OpenTicketFormProps>) {
  const notify = useNotify();
  const [openTicket] = useClientHubOpenTicketMutation();
  const methods = useForm<OpenTicketValues>({
    mode: 'onTouched',
    resolver: zodResolver(openTicketSchema),
    defaultValues: OPEN_TICKET_DEFAULTS,
  });

  const onSubmit = async (input: OpenTicketValues) => {
    try {
      const { data } = await openTicket({ variables: { input } });
      notify('Ticket {reference} raised — we will reply here and by email', 'success', {
        reference: data?.clientHubOpenTicket.reference ?? '',
      });
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'The ticket could not be raised'), 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={false} onCancel={onCancel}>
      <RhfTextField name="subject" label="Subject" />
      <RhfSelect name="category" label="What is it about?" options={CATEGORY_OPTIONS} />
      <RhfSelect name="priority" label="How urgent is it?" options={PRIORITY_OPTIONS} />
      <RhfTextField name="description" label="Describe the problem" multiline minRows={5} />
    </EntityForm>
  );
}

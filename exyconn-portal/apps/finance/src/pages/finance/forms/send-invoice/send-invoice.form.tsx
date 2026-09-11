import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useGetClientQuery, useSendInvoiceMutation } from '@exyconn/shell/graphql/generated';
import type { SendInvoiceTarget } from './send-invoice.types';

const schema = z.object({
  email: z.string().trim().regex(EMAIL, 'Enter a valid email'),
  message: z.string().trim().max(1000, 'Keep the message under 1000 characters'),
});
type Values = z.infer<typeof schema>;

interface SendInvoiceFormProps {
  invoice: SendInvoiceTarget;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Emails an invoice, PDF attached, to the client.
 *
 * The recipient starts as the client's email on file and can be changed for this send —
 * accounts payable is often a different inbox from the contact who signed the work.
 */
export function SendInvoiceForm({ invoice, onDone, onCancel }: Readonly<SendInvoiceFormProps>) {
  const notify = useNotify();
  const [sendInvoice] = useSendInvoiceMutation();
  const { data: clientData } = useGetClientQuery({ variables: { id: invoice.clientId } });
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', message: '' },
  });

  const clientEmail = clientData?.getClient.email ?? '';
  useEffect(() => {
    if (clientEmail && !methods.getFieldState('email').isDirty) {
      methods.setValue('email', clientEmail);
    }
  }, [clientEmail, methods]);

  const onSubmit = async (values: Values) => {
    try {
      await sendInvoice({
        variables: { id: invoice.id, email: values.email, message: values.message || null },
      });
      notify(`Invoice ${invoice.number} sent to ${values.email}`);
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Send failed'), 'error');
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
      <Text size="sm" color="text.secondary">
        Sending invoice {invoice.number} to {invoice.clientName || 'the client'} as a PDF.
      </Text>
      <RhfTextField name="email" label="Recipient email" />
      <RhfTextField name="message" label="Message (optional)" multiline minRows={3} />
    </EntityForm>
  );
}

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfMultiSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useClientEmailRecipientsQuery,
  useEmailClientMutation,
} from '@exyconn/shell/graphql/generated';
import {
  emailClientDefaults,
  emailClientSchema,
  type EmailClientFormValues,
} from './email-client.types';

interface EmailClientFormProps {
  clientId: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Emails the client from the company's address — to their own address or their hub contacts,
 * nobody else — and files the email in their communication log.
 */
export function EmailClientForm({ clientId, onDone, onCancel }: Readonly<EmailClientFormProps>) {
  const notify = useNotify();
  const { data, error: loadError } = useClientEmailRecipientsQuery({ variables: { clientId } });
  const [emailClient] = useEmailClientMutation();
  const methods = useForm<EmailClientFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(emailClientSchema),
    defaultValues: emailClientDefaults,
  });
  const recipients = data?.clientEmailRecipients;
  const options = (recipients ?? []).map((person) => ({
    value: person.email,
    label: `${person.name} <${person.email}>`,
  }));
  // Everyone on file is picked to begin with; untick whoever should not get it.
  const { setValue } = methods;
  useEffect(() => {
    if (recipients) {
      setValue(
        'to',
        recipients.map((person) => person.email),
      );
    }
  }, [recipients, setValue]);

  const onSubmit = async (input: EmailClientFormValues) => {
    try {
      const result = await emailClient({ variables: { clientId, input } });
      notify('Email sent to {count} people', 'success', { count: result.data?.emailClient ?? 0 });
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'The email could not be sent'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Send"
      onCancel={onCancel}
    >
      {loadError && (
        <Alert severity="error">
          {errorMessage(loadError, 'Could not load the client’s addresses')}
        </Alert>
      )}
      <RhfMultiSelect
        name="to"
        label="To"
        options={options}
        helperText="The client’s own address and their hub contacts"
      />
      <RhfTextField name="subject" label="Subject" />
      <RhfTextField
        name="message"
        label="Message"
        multiline
        minRows={6}
        helperText="Plain text; it is also filed in the communication log"
      />
    </EntityForm>
  );
}

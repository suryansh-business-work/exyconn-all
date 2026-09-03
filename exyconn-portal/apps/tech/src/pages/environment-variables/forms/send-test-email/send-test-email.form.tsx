import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSendTestEmailMutation } from '@exyconn/shell/graphql/generated';

const schema = z.object({
  to: z.string().trim().min(1, 'Recipient email is required').email('Enter a valid email'),
});
type Values = z.infer<typeof schema>;

interface SendTestEmailFormProps {
  configId: string;
  configLabel: string;
  defaultTo?: string;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to send a verification email through a specific SMTP config. */
export function SendTestEmailForm({
  configId,
  configLabel,
  defaultTo = '',
  onDone,
  onCancel,
}: SendTestEmailFormProps) {
  const notify = useNotify();
  const [sendTest] = useSendTestEmailMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    values: { to: defaultTo },
  });

  const onSubmit = async ({ to }: Values) => {
    try {
      await sendTest({ variables: { id: configId, to } });
      notify(`Test email sent to ${to}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Send failed', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send test"
    >
      <Text size="sm" color="text.secondary">
        Send a verification email using the &ldquo;{configLabel}&rdquo; SMTP configuration.
      </Text>
      <RhfTextField name="to" label="Recipient email" type="email" />
    </EntityForm>
  );
}

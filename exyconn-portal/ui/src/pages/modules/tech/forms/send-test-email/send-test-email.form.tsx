import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex, Text } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useSendTestEmailMutation } from '@/graphql/generated';

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
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <Text size="sm" color="text.secondary">
            Send a verification email using the &ldquo;{configLabel}&rdquo; SMTP configuration.
          </Text>
          <RhfTextField name="to" label="Recipient email" type="email" />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={false}
            onCancel={onCancel}
            submitLabel="Send test"
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

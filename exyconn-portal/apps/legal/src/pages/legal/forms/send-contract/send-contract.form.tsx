import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSendContractMutation } from '@exyconn/shell/graphql/generated';
import type { SendContractTarget } from './send-contract.types';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  message: z.string().trim().max(1000, 'Keep the message under 1000 characters'),
});
type Values = z.infer<typeof schema>;

interface SendContractFormProps {
  contract: SendContractTarget;
  onDone: () => void;
  onCancel: () => void;
}

/** Emails a contract to a counterparty via the active SMTP config. */
export function SendContractForm({ contract, onDone, onCancel }: SendContractFormProps) {
  const notify = useNotify();
  const [sendContract] = useSendContractMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', message: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await sendContract({
        variables: { id: contract.id, email: values.email, message: values.message || null },
      });
      notify(`Contract sent to ${values.email}`);
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
            Sending “{contract.title}” to {contract.party}.
          </Text>
          <RhfTextField name="email" label="Recipient email" />
          <RhfTextField name="message" label="Message (optional)" multiline minRows={3} />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={false}
            onCancel={onCancel}
            submitLabel="Send"
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

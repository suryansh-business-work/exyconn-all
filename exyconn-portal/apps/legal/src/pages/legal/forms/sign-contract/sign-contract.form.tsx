import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSignContractMutation } from '@exyconn/shell/graphql/generated';
import type { SignContractTarget } from './sign-contract.types';

const schema = z.object({
  signedBy: z.string().trim().min(1, 'Signer name is required'),
});
type Values = z.infer<typeof schema>;

interface SignContractFormProps {
  contract: SignContractTarget;
  onDone: () => void;
  onCancel: () => void;
}

/** Records a signer for a contract and marks it active. */
export function SignContractForm({ contract, onDone, onCancel }: SignContractFormProps) {
  const notify = useNotify();
  const [signContract] = useSignContractMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { signedBy: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await signContract({ variables: { id: contract.id, signedBy: values.signedBy } });
      notify(`“${contract.title}” signed by ${values.signedBy}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Sign failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <Text size="sm" color="text.secondary">
            Signing “{contract.title}” with {contract.party}.
          </Text>
          <RhfTextField name="signedBy" label="Signed by (full name)" />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={false}
            onCancel={onCancel}
            submitLabel="Sign"
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

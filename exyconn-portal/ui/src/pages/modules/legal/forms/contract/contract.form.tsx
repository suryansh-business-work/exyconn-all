import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  ContractType,
  ContractStatus,
  useCreateContractMutation,
  useUpdateContractMutation,
} from '@/graphql/generated';
import type { ContractRow } from './contract.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  party: z.string().trim().min(1, 'Party is required'),
  type: z.nativeEnum(ContractType),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  status: z.nativeEnum(ContractStatus),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ContractRow | null): Values => ({
  title: row?.title ?? '',
  party: row?.party ?? '',
  type: row?.type ?? ContractType.Nda,
  effectiveDate: row?.effectiveDate ?? '',
  expiryDate: row?.expiryDate ?? '',
  status: row?.status ?? ContractStatus.Draft,
});

interface ContractFormProps {
  initial: ContractRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a contract. */
export function ContractForm({ initial, onDone, onCancel }: ContractFormProps) {
  const notify = useNotify();
  const [createContract] = useCreateContractMutation();
  const [updateContract] = useUpdateContractMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateContract({ variables: { id: initial.id, input: values } });
      else await createContract({ variables: { input: values } });
      notify(`Contract ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="title" label="Title" />
          <RhfTextField name="party" label="Counterparty" />
          <RhfSelect name="type" label="Type" options={enumOptions(Object.values(ContractType))} />
          <RhfDatePicker name="effectiveDate" label="Effective date" />
          <RhfDatePicker name="expiryDate" label="Expiry date" />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(ContractStatus))}
          />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

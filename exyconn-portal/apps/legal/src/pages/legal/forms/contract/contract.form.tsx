import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ContractType,
  ContractStatus,
  useCreateContractMutation,
  useUpdateContractMutation,
} from '@exyconn/shell/graphql/generated';
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
  const [createContract] = useCreateContractMutation();
  const [updateContract] = useUpdateContractMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Contract',
    initial,
    create: (values: Values) => createContract({ variables: { input: values } }),
    update: (row, values) => updateContract({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
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
    </EntityForm>
  );
}

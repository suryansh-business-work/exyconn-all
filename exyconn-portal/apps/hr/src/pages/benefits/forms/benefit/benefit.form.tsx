import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  RhfAutocomplete,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  BenefitKind,
  useListUsersQuery,
  useCreateBenefitMutation,
  useUpdateBenefitMutation,
} from '@exyconn/shell/graphql/generated';
import type { BenefitRow } from './benefit.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  kind: z.nativeEnum(BenefitKind),
  name: z.string().trim().min(1, 'Name is required'),
  provider: z.string().trim().min(1, 'Provider is required'),
  reference: z.string().trim().min(1, 'Reference is required'),
  coverage: z.string().trim().min(1, 'Coverage is required'),
  validFrom: z.string(),
  validTo: z.string(),
  documentUrl: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: BenefitRow | null) => ({
  employeeId: row?.employeeId ?? '',
  kind: row?.kind ?? Object.values(BenefitKind)[0],
  name: row?.name ?? '',
  provider: row?.provider ?? '',
  reference: row?.reference ?? '',
  coverage: row?.coverage ?? '',
  validFrom: row?.validFrom ?? '',
  validTo: row?.validTo ?? '',
  documentUrl: row?.documentUrl ?? '',
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  validFrom: values.validFrom === '' ? null : values.validFrom,
  validTo: values.validTo === '' ? null : values.validTo,
  documentUrl: values.documentUrl === '' ? null : values.documentUrl,
});

interface BenefitFormProps {
  initial: BenefitRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a benefit. */
export function BenefitForm({ initial, onDone, onCancel }: Readonly<BenefitFormProps>) {
  const [createBenefit] = useCreateBenefitMutation();
  const [updateBenefit] = useUpdateBenefitMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Benefit',
    initial,
    create: (values: Values) => createBenefit({ variables: { input: toInput(values) } }),
    update: (row, values) => updateBenefit({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfSelect name="kind" label="Type" options={enumOptions(Object.values(BenefitKind))} />
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="provider" label="Provider" />
      <RhfTextField name="reference" label="Reference" />
      <RhfTextField name="coverage" label="Coverage" />
      <RhfDatePicker name="validFrom" label="Valid from" />
      <RhfDatePicker name="validTo" label="Valid to" />
      <RhfTextField name="documentUrl" label="Document link" />
    </EntityForm>
  );
}

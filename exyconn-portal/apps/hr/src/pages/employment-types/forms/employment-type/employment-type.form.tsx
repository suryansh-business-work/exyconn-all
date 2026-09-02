import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateEmploymentTypeMutation,
  useUpdateEmploymentTypeMutation,
} from '@exyconn/shell/graphql/generated';
import type { EmploymentTypeRow } from './employment-type.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
  description: z.string().trim(),
  payrollEligible: z.boolean(),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: EmploymentTypeRow | null) => ({
  name: row?.name ?? '',
  code: row?.code ?? '',
  description: row?.description ?? '',
  payrollEligible: row?.payrollEligible ?? false,
  active: row?.active ?? false,
});

const toInput = (values: Values) => values;

interface EmploymentTypeFormProps {
  initial: EmploymentTypeRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an employment type. */
export function EmploymentTypeForm({
  initial,
  onDone,
  onCancel,
}: Readonly<EmploymentTypeFormProps>) {
  const [createEmploymentType] = useCreateEmploymentTypeMutation();
  const [updateEmploymentType] = useUpdateEmploymentTypeMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'EmploymentType',
    initial,
    create: (values: Values) => createEmploymentType({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateEmploymentType({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="code" label="Code" />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <RhfSwitch name="payrollEligible" label="Payroll eligible" />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}

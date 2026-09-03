import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfAutocomplete, RhfDatePicker, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';

import {
  useListUsersQuery,
  useCreateSalaryStructureMutation,
  useUpdateSalaryStructureMutation,
} from '@exyconn/shell/graphql/generated';
import type { SalaryStructureRow } from './salary-structure.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  currency: z.string().trim().min(1, 'Currency is required'),
  basic: z.coerce.number({ message: 'Basic must be a number' }).min(0, 'Must be ≥ 0'),
  hra: z.coerce.number({ message: 'HRA must be a number' }).min(0, 'Must be ≥ 0'),
  allowances: z.coerce.number({ message: 'Allowances must be a number' }).min(0, 'Must be ≥ 0'),
  deductions: z.coerce.number({ message: 'Deductions must be a number' }).min(0, 'Must be ≥ 0'),
  effectiveFrom: z.string().min(1, 'Effective from is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: SalaryStructureRow | null) => ({
  employeeId: row?.employeeId ?? '',
  currency: row?.currency ?? '',
  basic: row?.basic ?? 0,
  hra: row?.hra ?? 0,
  allowances: row?.allowances ?? 0,
  deductions: row?.deductions ?? 0,
  effectiveFrom: row?.effectiveFrom ?? '',
});

const toInput = (values: Values) => values;

interface SalaryStructureFormProps {
  initial: SalaryStructureRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a salary structure. */
export function SalaryStructureForm({
  initial,
  onDone,
  onCancel,
}: Readonly<SalaryStructureFormProps>) {
  const [createSalaryStructure] = useCreateSalaryStructureMutation();
  const [updateSalaryStructure] = useUpdateSalaryStructureMutation();
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
    label: 'SalaryStructure',
    initial,
    create: (values: Values) => createSalaryStructure({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateSalaryStructure({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfTextField name="currency" label="Currency" />
      <RhfTextField name="basic" label="Basic" type="number" />
      <RhfTextField name="hra" label="HRA" type="number" />
      <RhfTextField name="allowances" label="Allowances" type="number" />
      <RhfTextField name="deductions" label="Deductions" type="number" />
      <RhfDatePicker name="effectiveFrom" label="Effective from" />
    </EntityForm>
  );
}

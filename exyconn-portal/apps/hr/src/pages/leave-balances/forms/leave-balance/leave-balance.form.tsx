import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfAutocomplete, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useListUsersQuery,
  useCreateLeaveBalanceMutation,
  useUpdateLeaveBalanceMutation,
} from '@exyconn/shell/graphql/generated';
import type { LeaveBalanceRow } from './leave-balance.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  leaveTypeCode: z.string().trim().min(1, 'Policy code is required'),
  year: z.coerce.number({ message: 'Year must be a number' }).min(0, 'Must be ≥ 0'),
  allocated: z.coerce.number({ message: 'Allocated must be a number' }).min(0, 'Must be ≥ 0'),
  carriedForward: z.coerce
    .number({ message: 'Carried forward must be a number' })
    .min(0, 'Must be ≥ 0'),
  used: z.coerce.number({ message: 'Used must be a number' }).min(0, 'Must be ≥ 0'),
  adjustment: z.coerce.number({ message: 'Adjustment must be a number' }).min(0, 'Must be ≥ 0'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: LeaveBalanceRow | null) => ({
  employeeId: row?.employeeId ?? '',
  leaveTypeCode: row?.leaveTypeCode ?? '',
  year: row?.year ?? 0,
  allocated: row?.allocated ?? 0,
  carriedForward: row?.carriedForward ?? 0,
  used: row?.used ?? 0,
  adjustment: row?.adjustment ?? 0,
});

const toInput = (values: Values) => values;

interface LeaveBalanceFormProps {
  initial: LeaveBalanceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a balance. */
export function LeaveBalanceForm({ initial, onDone, onCancel }: Readonly<LeaveBalanceFormProps>) {
  const [createLeaveBalance] = useCreateLeaveBalanceMutation();
  const [updateLeaveBalance] = useUpdateLeaveBalanceMutation();
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
    label: 'LeaveBalance',
    initial,
    create: (values: Values) => createLeaveBalance({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateLeaveBalance({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfTextField name="leaveTypeCode" label="Policy code" />
      <RhfTextField name="year" label="Year" type="number" />
      <RhfTextField name="allocated" label="Allocated" type="number" />
      <RhfTextField name="carriedForward" label="Carried forward" type="number" />
      <RhfTextField name="used" label="Used" type="number" />
      <RhfTextField name="adjustment" label="Adjustment" type="number" />
    </EntityForm>
  );
}

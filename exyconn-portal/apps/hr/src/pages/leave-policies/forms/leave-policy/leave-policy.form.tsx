import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateLeavePolicyMutation,
  useUpdateLeavePolicyMutation,
} from '@exyconn/shell/graphql/generated';
import type { LeavePolicyRow } from './leave-policy.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
  annualQuota: z.coerce
    .number({ message: 'Annual quota (days) must be a number' })
    .min(0, 'Must be ≥ 0'),
  carryForwardCap: z.coerce
    .number({ message: 'Carry-forward cap must be a number' })
    .min(0, 'Must be ≥ 0'),
  paid: z.boolean(),
  halfDayAllowed: z.boolean(),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: LeavePolicyRow | null) => ({
  name: row?.name ?? '',
  code: row?.code ?? '',
  annualQuota: row?.annualQuota ?? 0,
  carryForwardCap: row?.carryForwardCap ?? 0,
  paid: row?.paid ?? false,
  halfDayAllowed: row?.halfDayAllowed ?? false,
  active: row?.active ?? false,
});

const toInput = (values: Values) => values;

interface LeavePolicyFormProps {
  initial: LeavePolicyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a leave policy. */
export function LeavePolicyForm({ initial, onDone, onCancel }: Readonly<LeavePolicyFormProps>) {
  const [createLeavePolicy] = useCreateLeavePolicyMutation();
  const [updateLeavePolicy] = useUpdateLeavePolicyMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'LeavePolicy',
    initial,
    create: (values: Values) => createLeavePolicy({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateLeavePolicy({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="code" label="Code" />
      <RhfTextField name="annualQuota" label="Annual quota (days)" type="number" />
      <RhfTextField name="carryForwardCap" label="Carry-forward cap" type="number" />
      <RhfSwitch name="paid" label="Paid leave" />
      <RhfSwitch name="halfDayAllowed" label="Half day allowed" />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}

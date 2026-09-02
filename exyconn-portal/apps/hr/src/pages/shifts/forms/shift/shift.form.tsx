import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCreateShiftMutation, useUpdateShiftMutation } from '@exyconn/shell/graphql/generated';
import type { ShiftRow } from './shift.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
  startTime: z.string().trim().min(1, 'Start (HH:mm) is required'),
  endTime: z.string().trim().min(1, 'End (HH:mm) is required'),
  breakMinutes: z.coerce
    .number({ message: 'Break (minutes) must be a number' })
    .min(0, 'Must be ≥ 0'),
  graceMinutes: z.coerce
    .number({ message: 'Grace (minutes) must be a number' })
    .min(0, 'Must be ≥ 0'),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ShiftRow | null) => ({
  name: row?.name ?? '',
  code: row?.code ?? '',
  startTime: row?.startTime ?? '',
  endTime: row?.endTime ?? '',
  breakMinutes: row?.breakMinutes ?? 0,
  graceMinutes: row?.graceMinutes ?? 0,
  active: row?.active ?? false,
});

const toInput = (values: Values) => values;

interface ShiftFormProps {
  initial: ShiftRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a shift. */
export function ShiftForm({ initial, onDone, onCancel }: Readonly<ShiftFormProps>) {
  const [createShift] = useCreateShiftMutation();
  const [updateShift] = useUpdateShiftMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Shift',
    initial,
    create: (values: Values) => createShift({ variables: { input: toInput(values) } }),
    update: (row, values) => updateShift({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="code" label="Code" />
      <RhfTextField name="startTime" label="Start (HH:mm)" />
      <RhfTextField name="endTime" label="End (HH:mm)" />
      <RhfTextField name="breakMinutes" label="Break (minutes)" type="number" />
      <RhfTextField name="graceMinutes" label="Grace (minutes)" type="number" />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}

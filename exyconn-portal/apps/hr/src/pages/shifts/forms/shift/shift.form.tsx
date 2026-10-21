import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { RhfSwitch, RhfTextField, RhfTimePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCreateShiftMutation, useUpdateShiftMutation } from '@exyconn/shell/graphql/generated';
import type { ShiftRow } from './shift.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
  startTime: z.string().trim().min(1, 'Start time is required'),
  endTime: z.string().trim().min(1, 'End time is required'),
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
    mode: 'onTouched',
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
      <RhfTextField
        name="name"
        label="Name"
        helperText="The shift as people know it, e.g. Morning shift."
      />
      <RhfTextField name="code" label="Code" helperText="A short reference, e.g. MOR." />
      <RhfTimePicker
        name="startTime"
        label="Start time"
        helperText="When the shift begins each working day."
      />
      <RhfTimePicker
        name="endTime"
        label="End time"
        helperText="When the shift ends each working day."
      />
      <RhfTextField
        name="breakMinutes"
        label="Break (minutes)"
        type="number"
        helperText="Unpaid break time within the shift, in minutes, e.g. 60."
      />
      <RhfTextField
        name="graceMinutes"
        label="Grace (minutes)"
        type="number"
        helperText="How many minutes late someone can start before it counts as late, e.g. 15."
      />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}

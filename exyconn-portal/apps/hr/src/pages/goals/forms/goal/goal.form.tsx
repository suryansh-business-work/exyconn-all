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
  GoalStatus,
  useListUsersQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
} from '@exyconn/shell/graphql/generated';
import type { GoalRow } from './goal.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  kpi: z.string().trim().min(1, 'KPI is required'),
  weightage: z.coerce.number({ message: 'Weightage % must be a number' }).min(0, 'Must be ≥ 0'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  progress: z.coerce.number({ message: 'Progress % must be a number' }).min(0, 'Must be ≥ 0'),
  status: z.nativeEnum(GoalStatus),
  managerComment: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: GoalRow | null) => ({
  employeeId: row?.employeeId ?? '',
  title: row?.title ?? '',
  description: row?.description ?? '',
  kpi: row?.kpi ?? '',
  weightage: row?.weightage ?? 0,
  startDate: row?.startDate ?? '',
  endDate: row?.endDate ?? '',
  progress: row?.progress ?? 0,
  status: row?.status ?? Object.values(GoalStatus)[0],
  managerComment: row?.managerComment ?? '',
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  managerComment: values.managerComment === '' ? null : values.managerComment,
});

interface GoalFormProps {
  initial: GoalRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a goal. */
export function GoalForm({ initial, onDone, onCancel }: Readonly<GoalFormProps>) {
  const [createGoal] = useCreateGoalMutation();
  const [updateGoal] = useUpdateGoalMutation();
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
    label: 'Goal',
    initial,
    create: (values: Values) => createGoal({ variables: { input: toInput(values) } }),
    update: (row, values) => updateGoal({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <RhfTextField name="kpi" label="KPI" />
      <RhfTextField name="weightage" label="Weightage %" type="number" />
      <RhfDatePicker name="startDate" label="Start date" />
      <RhfDatePicker name="endDate" label="End date" />
      <RhfTextField name="progress" label="Progress %" type="number" />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(GoalStatus))} />
      <RhfTextField name="managerComment" label="Manager comment" multiline minRows={3} />
    </EntityForm>
  );
}

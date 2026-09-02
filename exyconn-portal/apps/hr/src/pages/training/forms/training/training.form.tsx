import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfAutocomplete,
  RhfDatePicker,
  RhfSelect,
  RhfTextField,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  TrainingStatus,
  useListUsersQuery,
  useCreateTrainingMutation,
  useUpdateTrainingMutation,
} from '@exyconn/shell/graphql/generated';
import type { TrainingRow } from './training.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  title: z.string().trim().min(1, 'Course is required'),
  provider: z.string().trim().min(1, 'Provider is required'),
  category: z.string().trim().min(1, 'Category is required'),
  assignedOn: z.string().min(1, 'Assigned on is required'),
  dueOn: z.string(),
  completedOn: z.string(),
  status: z.nativeEnum(TrainingStatus),
  certificateUrl: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: TrainingRow | null) => ({
  employeeId: row?.employeeId ?? '',
  title: row?.title ?? '',
  provider: row?.provider ?? '',
  category: row?.category ?? '',
  assignedOn: row?.assignedOn ?? '',
  dueOn: row?.dueOn ?? '',
  completedOn: row?.completedOn ?? '',
  status: row?.status ?? Object.values(TrainingStatus)[0],
  certificateUrl: row?.certificateUrl ?? '',
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  dueOn: values.dueOn === '' ? null : values.dueOn,
  completedOn: values.completedOn === '' ? null : values.completedOn,
  certificateUrl: values.certificateUrl === '' ? null : values.certificateUrl,
});

interface TrainingFormProps {
  initial: TrainingRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a training. */
export function TrainingForm({ initial, onDone, onCancel }: Readonly<TrainingFormProps>) {
  const [createTraining] = useCreateTrainingMutation();
  const [updateTraining] = useUpdateTrainingMutation();
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
    label: 'Training',
    initial,
    create: (values: Values) => createTraining({ variables: { input: toInput(values) } }),
    update: (row, values) => updateTraining({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfTextField name="title" label="Course" />
      <RhfTextField name="provider" label="Provider" />
      <RhfTextField name="category" label="Category" />
      <RhfDatePicker name="assignedOn" label="Assigned on" />
      <RhfDatePicker name="dueOn" label="Due on" />
      <RhfDatePicker name="completedOn" label="Completed on" />
      <RhfSelect
        name="status"
        label="Status"
        options={enumOptions(Object.values(TrainingStatus))}
      />
      <RhfTextField name="certificateUrl" label="Certificate link" />
    </EntityForm>
  );
}

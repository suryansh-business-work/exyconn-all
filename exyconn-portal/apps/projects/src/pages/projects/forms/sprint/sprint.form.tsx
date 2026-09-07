import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCreateSprintMutation, useUpdateSprintMutation } from '@exyconn/shell/graphql/generated';
import type { SprintRow } from './sprint.types';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(60, 'Keep the name under 60 characters'),
    goal: z.string().trim().max(200, 'Keep the goal under 200 characters'),
    startsOn: z.string(),
    endsOn: z.string(),
  })
  .refine((v) => !v.startsOn || !v.endsOn || new Date(v.endsOn) >= new Date(v.startsOn), {
    path: ['endsOn'],
    message: 'The sprint cannot end before it starts',
  });

type Values = z.infer<typeof schema>;

const toInput = (values: Values) => ({
  name: values.name,
  goal: values.goal,
  startsOn: values.startsOn || null,
  endsOn: values.endsOn || null,
});

const toInitial = (row: SprintRow | null): Values => ({
  name: row?.name ?? '',
  goal: row?.goal ?? '',
  startsOn: row?.startsOn ?? '',
  endsOn: row?.endsOn ?? '',
});

interface SprintFormProps {
  projectId: string;
  initial: SprintRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to plan or re-plan one sprint. */
export function SprintForm({ projectId, initial, onDone, onCancel }: Readonly<SprintFormProps>) {
  const [createSprint] = useCreateSprintMutation();
  const [updateSprint] = useUpdateSprintMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Sprint',
    initial,
    create: (values: Values) => createSprint({ variables: { projectId, input: toInput(values) } }),
    update: (row, values) => updateSprint({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Sprint name" helperText="e.g. Sprint 12" />
      <RhfTextField
        name="goal"
        label="Goal (optional)"
        multiline
        minRows={2}
        helperText="What this sprint is for, in one sentence"
      />
      <RhfDatePicker name="startsOn" label="Starts on" />
      <RhfDatePicker name="endsOn" label="Ends on" />
    </EntityForm>
  );
}

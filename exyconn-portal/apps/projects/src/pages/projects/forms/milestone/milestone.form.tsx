import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfDatePicker, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  MilestoneState,
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
} from '@exyconn/shell/graphql/generated';
import type { MilestoneRow } from './milestone.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Keep the name under 80 characters'),
  description: z.string().trim().max(300, 'Keep the description under 300 characters'),
  dueOn: z.string(),
  state: z.nativeEnum(MilestoneState),
});

type Values = z.infer<typeof schema>;

const toInput = (values: Values) => ({
  name: values.name,
  description: values.description,
  dueOn: values.dueOn || null,
  state: values.state,
});

const toInitial = (row: MilestoneRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  dueOn: row?.dueOn ?? '',
  state: row?.state ?? MilestoneState.Planned,
});

interface MilestoneFormProps {
  projectId: string;
  initial: MilestoneRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for one dated commitment on a project.
 *
 * Milestones are the only part of a project's plan a shared client link shows, so what is
 * written here is written for a client to read.
 */
export function MilestoneForm({
  projectId,
  initial,
  onDone,
  onCancel,
}: Readonly<MilestoneFormProps>) {
  const [createMilestone] = useCreateMilestoneMutation();
  const [updateMilestone] = useUpdateMilestoneMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Milestone',
    initial,
    create: (values: Values) =>
      createMilestone({ variables: { projectId, input: toInput(values) } }),
    update: (row, values) => updateMilestone({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Milestone" helperText="e.g. Go live" />
      <RhfTextField
        name="description"
        label="Description (optional)"
        multiline
        minRows={2}
        helperText="Shown to clients on a shared link — write it for them"
      />
      <RhfDatePicker name="dueOn" label="Due on" />
      <RhfSelect name="state" label="State" options={enumOptions(Object.values(MilestoneState))} />
    </EntityForm>
  );
}

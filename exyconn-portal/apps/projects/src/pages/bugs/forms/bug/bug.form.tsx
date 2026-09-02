import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  BugSeverity,
  BugStatus,
  useCreateBugMutation,
  useUpdateBugMutation,
} from '@exyconn/shell/graphql/generated';
import type { BugRow } from './bug.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .min(5, 'Add a little more detail'),
  severity: z.nativeEnum(BugSeverity),
  status: z.nativeEnum(BugStatus),
  assignee: z.string().trim().min(1, 'Assignee is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: BugRow | null): Values => ({
  title: row?.title ?? '',
  description: row?.description ?? '',
  severity: row?.severity ?? BugSeverity.Medium,
  status: row?.status ?? BugStatus.Open,
  assignee: row?.assignee ?? '',
  dueDate: row?.dueDate ?? '',
});

interface BugFormProps {
  initial: BugRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a bug. */
export function BugForm({ initial, onDone, onCancel }: BugFormProps) {
  const [createBug] = useCreateBugMutation();
  const [updateBug] = useUpdateBugMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Bug',
    initial,
    create: (values: Values) => createBug({ variables: { input: values } }),
    update: (row, values) => updateBug({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <RhfSelect
        name="severity"
        label="Severity"
        options={enumOptions(Object.values(BugSeverity))}
      />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(BugStatus))} />
      <RhfTextField name="assignee" label="Assignee" />
      <RhfDatePicker name="dueDate" label="Due date" />
    </EntityForm>
  );
}

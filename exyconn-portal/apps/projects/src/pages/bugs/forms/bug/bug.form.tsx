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
  BugSeverity,
  BugStatus,
  useCreateBugMutation,
  useListEmployeeOptionsQuery,
  useListProjectsQuery,
  useUpdateBugMutation,
} from '@exyconn/shell/graphql/generated';
import type { BugFormValues, BugRow } from './bug.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .min(5, 'Add a little more detail'),
  severity: z.nativeEnum(BugSeverity),
  status: z.nativeEnum(BugStatus),
  projectId: z.string(),
  assigneeId: z.string().min(1, 'Assignee is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: BugRow | null): BugFormValues => ({
  title: row?.title ?? '',
  description: row?.description ?? '',
  severity: row?.severity ?? BugSeverity.Medium,
  status: row?.status ?? BugStatus.Open,
  projectId: row?.projectId ?? '',
  assigneeId: row?.assigneeId ?? '',
  dueDate: row?.dueDate ?? '',
});

/** What the server stores: an empty project is "none", so it goes up as null. */
const toInput = (values: Values) => ({ ...values, projectId: values.projectId || null });

interface BugFormProps {
  initial: BugRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a bug. */
export function BugForm({ initial, onDone, onCancel }: Readonly<BugFormProps>) {
  const [createBug] = useCreateBugMutation();
  const [updateBug] = useUpdateBugMutation();
  const { data: projectData } = useListProjectsQuery();
  const { data: employeeData } = useListEmployeeOptionsQuery();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const projectOptions = (projectData?.listProjects ?? []).map((project) => ({
    value: project.id,
    label: `${project.key} · ${project.name}`,
  }));
  const assigneeOptions = (employeeData?.listEmployeeOptions ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Bug',
    initial,
    create: (values: Values) => createBug({ variables: { input: toInput(values) } }),
    update: (row, values) => updateBug({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <RhfAutocomplete
        name="projectId"
        label="Project"
        options={projectOptions}
        helperText="Needed to promote the bug to a board ticket"
      />
      <RhfSelect
        name="severity"
        label="Severity"
        options={enumOptions(Object.values(BugSeverity))}
      />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(BugStatus))} />
      <RhfAutocomplete name="assigneeId" label="Assignee" options={assigneeOptions} />
      <RhfDatePicker name="dueDate" label="Due date" />
    </EntityForm>
  );
}

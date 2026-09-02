import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ProjectStatus,
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from '@exyconn/shell/graphql/generated';
import type { ProjectRow } from './project.types';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    status: z.nativeEnum(ProjectStatus),
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || new Date(v.endDate) >= new Date(v.startDate), {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  });
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  name: values.name,
  description: values.description,
  status: values.status,
  startDate: values.startDate || null,
  endDate: values.endDate || null,
});

const toInitial = (row: ProjectRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  status: row?.status ?? ProjectStatus.Planning,
  startDate: row?.startDate ?? '',
  endDate: row?.endDate ?? '',
});

interface ProjectFormProps {
  initial: ProjectRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a project. */
export function ProjectForm({ initial, onDone, onCancel }: ProjectFormProps) {
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Project',
    initial,
    create: (values: Values) => createProject({ variables: { input: toInput(values) } }),
    update: (row, values) => updateProject({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Project name" />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(ProjectStatus))} />
      <RhfDatePicker name="startDate" label="Start date" />
      <RhfDatePicker name="endDate" label="End date" />
      <RhfTextField name="description" label="Description (optional)" multiline minRows={2} />
    </EntityForm>
  );
}

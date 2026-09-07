import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfAutocomplete,
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ProjectStatus,
  useCreateProjectMutation,
  useListClientsQuery,
  useUpdateProjectMutation,
} from '@exyconn/shell/graphql/generated';
import type { ProjectRow } from './project.types';

/** A budget is optional: an empty field means none was agreed, not zero. */
const optionalBudget = z.union([
  z.literal(''),
  z.coerce.number({ message: 'Must be a number' }).min(0, 'Must be ≥ 0'),
]);

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    status: z.nativeEnum(ProjectStatus),
    clientId: z.string(),
    budgetAmount: optionalBudget,
    budgetHours: optionalBudget,
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || new Date(v.endDate) >= new Date(v.startDate), {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  });
type Values = z.infer<typeof schema>;

const budgetOrNull = (value: '' | number): number | null => (value === '' ? null : value);

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  name: values.name,
  description: values.description,
  status: values.status,
  clientId: values.clientId || null,
  budgetAmount: budgetOrNull(values.budgetAmount),
  budgetHours: budgetOrNull(values.budgetHours),
  startDate: values.startDate || null,
  endDate: values.endDate || null,
});

const toInitial = (row: ProjectRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  status: row?.status ?? ProjectStatus.Planning,
  clientId: row?.clientId ?? '',
  budgetAmount: row?.budgetAmount ?? '',
  budgetHours: row?.budgetHours ?? '',
  startDate: row?.startDate ?? '',
  endDate: row?.endDate ?? '',
});

interface ProjectFormProps {
  initial: ProjectRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a project. */
export function ProjectForm({ initial, onDone, onCancel }: Readonly<ProjectFormProps>) {
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const { data: clientsData } = useListClientsQuery();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const clientOptions = (clientsData?.listClients ?? []).map((client) => ({
    value: client.id,
    label: `${client.name} · ${client.company}`,
  }));

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
      <RhfAutocomplete
        name="clientId"
        label="Client (optional)"
        options={clientOptions}
        helperText="Who the work is for"
      />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(ProjectStatus))} />
      <RhfTextField name="budgetAmount" label="Budget amount (optional)" type="number" />
      <RhfTextField name="budgetHours" label="Budget hours (optional)" type="number" />
      <RhfDatePicker name="startDate" label="Start date" />
      <RhfDatePicker name="endDate" label="End date" />
      <RhfTextField name="description" label="Description (optional)" multiline minRows={2} />
    </EntityForm>
  );
}

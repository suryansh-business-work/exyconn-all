import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { RhfAutocomplete, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useListUsersQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
} from '@exyconn/shell/graphql/generated';
import type { TeamRow } from './team.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  department: z.string().trim(),
  leadEmployeeId: z.string().min(1, 'Employee is required'),
  description: z.string().trim(),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: TeamRow | null) => ({
  name: row?.name ?? '',
  department: row?.department ?? '',
  leadEmployeeId: row?.leadEmployeeId ?? '',
  description: row?.description ?? '',
  active: row?.active ?? false,
});

interface TeamFormProps {
  initial: TeamRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a team. */
export function TeamForm({ initial, onDone, onCancel }: Readonly<TeamFormProps>) {
  const [createTeam] = useCreateTeamMutation();
  const [updateTeam] = useUpdateTeamMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Team',
    initial,
    create: (values: Values) => createTeam({ variables: { input: values } }),
    update: (row, values) => updateTeam({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="name"
        label="Name"
        helperText="The team as people know it, e.g. Payments squad."
      />
      <RhfTextField
        name="department"
        label="Department"
        helperText="Optional. The department the team belongs to, e.g. Engineering."
      />
      <RhfAutocomplete
        name="leadEmployeeId"
        label="Team lead"
        options={employeeOptions}
        helperText="The employee who leads the team."
      />
      <RhfTextField
        name="description"
        label="Description"
        multiline
        minRows={3}
        helperText="Optional. What the team works on."
      />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}

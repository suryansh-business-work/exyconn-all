import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useListDepartmentsQuery,
} from '@exyconn/shell/graphql/generated';
import type { PositionRow } from './position.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  department: z.string().min(1, 'Department is required'),
  description: z.string().trim().max(200, 'Keep the description under 200 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: PositionRow | null): Values => ({
  name: row?.name ?? '',
  department: row?.department ?? '',
  description: row?.description ?? '',
});

interface PositionFormProps {
  initial: PositionRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a position (with department). */
export function PositionForm({ initial, onDone, onCancel }: PositionFormProps) {
  const [createPosition] = useCreatePositionMutation();
  const [updatePosition] = useUpdatePositionMutation();
  const { data } = useListDepartmentsQuery();

  const departmentOptions = (data?.listDepartments ?? []).map((d) => ({
    value: d.name,
    label: d.name,
  }));

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Position',
    initial,
    create: (values: Values) => createPosition({ variables: { input: values } }),
    update: (row, values) => updatePosition({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Position name" />
      <RhfSelect
        name="department"
        label="Department"
        options={departmentOptions}
        helperText={
          departmentOptions.length ? undefined : 'Add departments in HR → Departments first.'
        }
      />
      <RhfTextField name="description" label="Description (optional)" multiline minRows={2} />
    </EntityForm>
  );
}

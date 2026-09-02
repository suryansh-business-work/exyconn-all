import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from '@exyconn/shell/graphql/generated';
import type { DepartmentRow } from './department.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().max(200, 'Keep the description under 200 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: DepartmentRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
});

interface DepartmentFormProps {
  initial: DepartmentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a department. */
export function DepartmentForm({ initial, onDone, onCancel }: DepartmentFormProps) {
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartment] = useUpdateDepartmentMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Department',
    initial,
    create: (values: Values) => createDepartment({ variables: { input: values } }),
    update: (row, values) => updateDepartment({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Department name" />
      <RhfTextField name="description" label="Description (optional)" multiline minRows={2} />
    </EntityForm>
  );
}

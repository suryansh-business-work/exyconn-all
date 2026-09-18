import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfAutocomplete, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateDepartmentMutation,
  useListEmployeeOptionsQuery,
  useUpdateDepartmentMutation,
} from '@exyconn/shell/graphql/generated';
import type { DepartmentFormValues, DepartmentRow } from './department.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Keep the name under 80 characters'),
  code: z.string().trim().max(12, 'Keep the code under 12 characters'),
  description: z.string().trim().max(200, 'Keep the description under 200 characters'),
  headId: z.string(),
});

const toInitial = (row: DepartmentRow | null): DepartmentFormValues => ({
  name: row?.name ?? '',
  code: row?.code ?? '',
  description: row?.description ?? '',
  headId: row?.headId ?? '',
});

const toInput = (values: DepartmentFormValues) => ({
  ...values,
  code: values.code || null,
  headId: values.headId || null,
});

interface DepartmentFormProps {
  initial: DepartmentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a department. */
export function DepartmentForm({ initial, onDone, onCancel }: Readonly<DepartmentFormProps>) {
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartment] = useUpdateDepartmentMutation();
  const { data } = useListEmployeeOptionsQuery();
  const headOptions = (data?.listEmployeeOptions ?? []).map((person) => ({
    value: person.id,
    label: person.name,
  }));
  const methods = useForm<DepartmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Department',
    initial,
    create: (values: DepartmentFormValues) =>
      createDepartment({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateDepartment({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="name"
        label="Department name"
        helperText={
          isEdit ? 'Renaming moves its positions and employees along with it.' : undefined
        }
      />
      <RhfTextField name="code" label="Code (optional)" helperText="A short reference, e.g. ENG." />
      <RhfAutocomplete name="headId" label="Head of department (optional)" options={headOptions} />
      <RhfTextField name="description" label="Description (optional)" multiline minRows={2} />
    </EntityForm>
  );
}

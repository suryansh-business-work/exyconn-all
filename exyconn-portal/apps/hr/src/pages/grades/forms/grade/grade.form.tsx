import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCreateGradeMutation, useUpdateGradeMutation } from '@exyconn/shell/graphql/generated';
import type { GradeRow } from './grade.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
  level: z.coerce.number({ message: 'Level must be a number' }).min(0, 'Must be ≥ 0'),
  minSalary: z.coerce.number({ message: 'Minimum salary must be a number' }).min(0, 'Must be ≥ 0'),
  maxSalary: z.coerce.number({ message: 'Maximum salary must be a number' }).min(0, 'Must be ≥ 0'),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: GradeRow | null) => ({
  name: row?.name ?? '',
  code: row?.code ?? '',
  level: row?.level ?? 0,
  minSalary: row?.minSalary ?? 0,
  maxSalary: row?.maxSalary ?? 0,
  active: row?.active ?? false,
});

const toInput = (values: Values) => values;

interface GradeFormProps {
  initial: GradeRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a grade. */
export function GradeForm({ initial, onDone, onCancel }: Readonly<GradeFormProps>) {
  const [createGrade] = useCreateGradeMutation();
  const [updateGrade] = useUpdateGradeMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Grade',
    initial,
    create: (values: Values) => createGrade({ variables: { input: toInput(values) } }),
    update: (row, values) => updateGrade({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="code" label="Code" />
      <RhfTextField name="level" label="Level" type="number" />
      <RhfTextField name="minSalary" label="Minimum salary" type="number" />
      <RhfTextField name="maxSalary" label="Maximum salary" type="number" />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}

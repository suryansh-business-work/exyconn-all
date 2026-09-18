import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RhfSelect,
  RhfSwitch,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreatePositionMutation,
  useListDepartmentsQuery,
  useListEmploymentTypesQuery,
  useListGradesQuery,
  useUpdatePositionMutation,
} from '@exyconn/shell/graphql/generated';
import type { PositionFormValues, PositionRow } from './position.types';
import {
  positionSchema,
  toFormValues,
  toPositionInput,
  type PositionSchemaInput,
} from './position.schema';

const NONE: SelectOption = { value: '', label: 'Not set' };

/** Active master records as picker options, led by "Not set". */
const codeOptions = (rows: ReadonlyArray<{ code: string; name: string; active: boolean }>) => [
  NONE,
  ...rows.filter((row) => row.active).map((row) => ({ value: row.code, label: row.name })),
];

interface PositionFormProps {
  initial: PositionRow | null;
  /** The department a new position is created in. */
  department: string;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a position inside a department. */
export function PositionForm({
  initial,
  department,
  onDone,
  onCancel,
}: Readonly<PositionFormProps>) {
  const [createPosition] = useCreatePositionMutation();
  const [updatePosition] = useUpdatePositionMutation();
  const { data: departments } = useListDepartmentsQuery();
  const { data: grades } = useListGradesQuery();
  const { data: types } = useListEmploymentTypesQuery();

  const departmentOptions = (departments?.listDepartments ?? []).map((d) => ({
    value: d.name,
    label: d.name,
  }));

  const methods = useForm<PositionSchemaInput, unknown, PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: toFormValues(initial, department),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Position',
    initial,
    create: (values: PositionFormValues) =>
      createPosition({ variables: { input: toPositionInput(values) } }),
    update: (row, values) =>
      updatePosition({ variables: { id: row.id, input: toPositionInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="name"
        label="Position name"
        helperText="Shown as the designation on employee records."
      />
      <RhfSelect name="department" label="Department" options={departmentOptions} />
      <RhfTextField name="code" label="Code (optional)" helperText="A short reference, e.g. SE2." />
      <RhfTextField name="description" label="Description (optional)" multiline minRows={3} />
      <RhfTextField
        name="minSalary"
        label="Minimum salary"
        type="number"
        helperText="Per month, in the company's currency."
      />
      <RhfTextField
        name="maxSalary"
        label="Maximum salary"
        type="number"
        helperText="Per month, in the company's currency."
      />
      <RhfSelect
        name="grade"
        label="Grade (optional)"
        options={codeOptions(grades?.listGrades ?? [])}
      />
      <RhfSelect
        name="employmentType"
        label="Employment type (optional)"
        options={codeOptions(types?.listEmploymentTypes ?? [])}
      />
      <RhfTextField
        name="headcount"
        label="Approved headcount"
        type="number"
        helperText="How many people may hold this position at once."
      />
      <RhfSwitch name="active" label="Open for new employees" />
    </EntityForm>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfAutocomplete } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  CompensationFields,
  compensationSchema,
  toCompensationValues,
  toSalaryInput,
} from '@exyconn/shell/components/pay';
import { useListUsersQuery, useSaveEmployeeSalaryMutation } from '@exyconn/shell/graphql/generated';
import type { SalaryStructureRow } from './salary-structure.types';

/**
 * Editing compensation from the Salaries list.
 *
 * The fields and the schema are the SAME ones the HR employee record uses — a pay type that
 * only one of the two screens could set would be a field the other silently reset. All this
 * form adds is choosing whose structure it is; the employee record already knows.
 */
const schema = z.intersection(
  z.object({ employeeId: z.string().min(1, 'Employee is required') }),
  compensationSchema,
);
type Values = z.infer<typeof schema>;

interface SalaryStructureFormProps {
  initial: SalaryStructureRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a salary structure. */
export function SalaryStructureForm({
  initial,
  onDone,
  onCancel,
}: Readonly<SalaryStructureFormProps>) {
  const notify = useNotify();
  const [saveSalary] = useSaveEmployeeSalaryMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: initial?.employeeId ?? '', ...toCompensationValues(initial) },
  });

  const isEdit = Boolean(initial);
  const onSubmit = async (values: Values) => {
    try {
      // An upsert keyed on the employee, so picking someone who already has a structure
      // updates theirs instead of failing on the unique index.
      await saveSalary({
        variables: { employeeId: values.employeeId, input: toSalaryInput(values) },
      });
      notify(isEdit ? 'Salary updated' : 'Salary saved');
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <CompensationFields />
    </EntityForm>
  );
}

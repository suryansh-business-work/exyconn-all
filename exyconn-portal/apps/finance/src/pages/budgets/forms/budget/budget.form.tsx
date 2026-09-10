import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useCreateBudgetMutation, useUpdateBudgetMutation } from '@exyconn/shell/graphql/generated';
import type { BudgetRow, CostCenterOption } from './budget.types';

const schema = z.object({
  costCenterId: z.string().min(1, 'Pick a cost centre'),
  // Matches the server's monthKey exactly; anything else could never be compared to actuals.
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM, e.g. 2026-04'),
  amount: z.coerce.number({ message: 'Amount must be a number' }).min(0, 'Must be ≥ 0'),
  currency: z.string().trim().min(1, 'Currency is required'),
  note: z.string().trim(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: BudgetRow | null): Values => ({
  costCenterId: row?.costCenterId ?? '',
  month: row?.month ?? '',
  amount: row?.amount ?? 0,
  currency: row?.currency ?? 'INR',
  note: row?.note ?? '',
});

interface BudgetFormProps {
  initial: BudgetRow | null;
  costCentres: CostCenterOption[];
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for one month's budget for one cost centre.
 *
 * Monthly rather than a date range because every actual figure in Finance is bucketed by
 * month; a budget with its own bounds could only be compared by apportioning it, and an
 * apportioned budget is a guess wearing a number's clothes. A quarter is three rows.
 */
export function BudgetForm({ initial, costCentres, onDone, onCancel }: Readonly<BudgetFormProps>) {
  const [createBudget] = useCreateBudgetMutation();
  const [updateBudget] = useUpdateBudgetMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Budget',
    initial,
    create: (values: Values) => createBudget({ variables: { input: values } }),
    update: (row, values) => updateBudget({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfSelect name="costCenterId" label="Cost centre" options={costCentres} />
      <RhfTextField name="month" label="Month" helperText="YYYY-MM — one row per month" />
      <RhfTextField name="amount" label="Budget amount" type="number" />
      <RhfTextField name="currency" label="Currency" />
      <RhfTextField name="note" label="Note" multiline rows={2} />
    </EntityForm>
  );
}

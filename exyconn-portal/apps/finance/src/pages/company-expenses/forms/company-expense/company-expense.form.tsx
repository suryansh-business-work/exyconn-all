import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ExpenseCategory,
  useCreateCompanyExpenseMutation,
  useUpdateCompanyExpenseMutation,
} from '@exyconn/shell/graphql/generated';
import type { CompanyExpenseRow } from './company-expense.types';

const schema = z
  .object({
    vendor: z.string().trim().min(1, 'Vendor is required'),
    category: z.nativeEnum(ExpenseCategory),
    description: z.string().trim(),
    amount: z.coerce.number({ message: 'Amount must be a number' }).min(0, 'Must be ≥ 0'),
    currency: z.string().trim().min(1, 'Currency is required'),
    incurredOn: z.string().min(1, 'Incurred date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
    reference: z.string().trim(),
  })
  // A bill due before it was incurred is a typo, and it would land in the wrong ageing band.
  .refine((values) => new Date(values.dueDate) >= new Date(values.incurredOn), {
    path: ['dueDate'],
    message: 'Due date cannot be before the date the cost was incurred',
  });
type Values = z.infer<typeof schema>;

const toInitial = (row: CompanyExpenseRow | null): Values => ({
  vendor: row?.vendor ?? '',
  category: row?.category ?? ExpenseCategory.Other,
  description: row?.description ?? '',
  amount: row?.amount ?? 0,
  currency: row?.currency ?? 'INR',
  incurredOn: row?.incurredOn ?? '',
  dueDate: row?.dueDate ?? '',
  reference: row?.reference ?? '',
});

interface CompanyExpenseFormProps {
  initial: CompanyExpenseRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a company cost.
 *
 * There is no "paid" field here on purpose: settling a bill records WHEN the money left,
 * which is the date every cash figure is built from, so it goes through Mark paid rather
 * than being a checkbox somebody can tick without saying when.
 */
export function CompanyExpenseForm({
  initial,
  onDone,
  onCancel,
}: Readonly<CompanyExpenseFormProps>) {
  const [createExpense] = useCreateCompanyExpenseMutation();
  const [updateExpense] = useUpdateCompanyExpenseMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Expense',
    initial,
    create: (values: Values) => createExpense({ variables: { input: values } }),
    update: (row, values) => updateExpense({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="vendor" label="Vendor" />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(ExpenseCategory))}
      />
      <RhfTextField name="amount" label="Amount" type="number" />
      <RhfTextField name="currency" label="Currency" />
      {/* Profit is measured on this date; the money leaving is a separate one (Mark paid). */}
      <RhfDatePicker name="incurredOn" label="Incurred on" />
      <RhfDatePicker name="dueDate" label="Due date" />
      <RhfTextField name="description" label="Description" multiline rows={2} />
      <RhfTextField name="reference" label="Reference" helperText="Bill number, PO, contract…" />
    </EntityForm>
  );
}

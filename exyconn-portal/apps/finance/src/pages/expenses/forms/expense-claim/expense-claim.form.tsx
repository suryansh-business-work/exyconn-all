import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  RhfAutocomplete,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ExpenseStatus,
  useListUsersQuery,
  useCreateExpenseClaimMutation,
  useUpdateExpenseClaimMutation,
} from '@exyconn/shell/graphql/generated';
import type { ExpenseClaimRow } from './expense-claim.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  category: z.string().trim().min(1, 'Category is required'),
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number({ message: 'Amount must be a number' }).min(0, 'Must be ≥ 0'),
  currency: z.string().trim().min(1, 'Currency is required'),
  incurredOn: z.string().min(1, 'Incurred on is required'),
  receiptUrl: z.string().trim(),
  status: z.nativeEnum(ExpenseStatus),
  approvedAmount: z.union([z.literal(''), z.coerce.number().min(0, 'Must be ≥ 0')]),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ExpenseClaimRow | null) => ({
  employeeId: row?.employeeId ?? '',
  category: row?.category ?? '',
  description: row?.description ?? '',
  amount: row?.amount ?? 0,
  currency: row?.currency ?? '',
  incurredOn: row?.incurredOn ?? '',
  receiptUrl: row?.receiptUrl ?? '',
  status: row?.status ?? Object.values(ExpenseStatus)[0],
  approvedAmount: row?.approvedAmount ?? '',
});

/** Empty optional inputs are "not set", which the API models as null. */
const toInput = (values: Values) => ({
  ...values,
  receiptUrl: values.receiptUrl === '' ? null : values.receiptUrl,
  approvedAmount: values.approvedAmount === '' ? null : values.approvedAmount,
});

interface ExpenseClaimFormProps {
  initial: ExpenseClaimRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an claim. */
export function ExpenseClaimForm({ initial, onDone, onCancel }: Readonly<ExpenseClaimFormProps>) {
  const [createExpenseClaim] = useCreateExpenseClaimMutation();
  const [updateExpenseClaim] = useUpdateExpenseClaimMutation();
  const { data } = useListUsersQuery();

  const employeeOptions = (data?.listUsers ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'ExpenseClaim',
    initial,
    create: (values: Values) => createExpenseClaim({ variables: { input: toInput(values) } }),
    update: (row, values) =>
      updateExpenseClaim({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfTextField name="category" label="Category" />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <RhfTextField name="amount" label="Amount" type="number" />
      <RhfTextField name="currency" label="Currency" />
      <RhfDatePicker name="incurredOn" label="Incurred on" />
      <RhfTextField name="receiptUrl" label="Receipt link" />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(ExpenseStatus))} />
      <RhfTextField name="approvedAmount" label="Approved amount" type="number" />
    </EntityForm>
  );
}

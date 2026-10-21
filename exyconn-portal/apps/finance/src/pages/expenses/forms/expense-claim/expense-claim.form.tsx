import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { currencyField } from '@exyconn/shell/utils/currencyField';
import { HTTP_URL } from '@exyconn/regex';
import {
  RhfTextField,
  RhfImageField,
  RhfSelect,
  RhfDatePicker,
  RhfAutocomplete,
  RhfCurrencyField,
  useCompanyCurrency,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ExpenseStatus,
  useListEmployeeOptionsQuery,
  useCreateExpenseClaimMutation,
  useUpdateExpenseClaimMutation,
} from '@exyconn/shell/graphql/generated';
import type { ExpenseClaimRow } from './expense-claim.types';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  category: z.string().trim().min(1, 'Category is required'),
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number({ message: 'Amount must be a number' }).min(0, 'Must be ≥ 0'),
  currency: currencyField,
  incurredOn: z.string().min(1, 'Incurred on is required'),
  receiptUrl: z
    .string()
    .trim()
    .regex(HTTP_URL, 'Enter a full URL starting with https://')
    .or(z.literal('')),
  status: z.enum(ExpenseStatus),
  approvedAmount: z.union([z.literal(''), z.coerce.number().min(0, 'Must be ≥ 0')]),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ExpenseClaimRow | null, currency: string) => ({
  employeeId: row?.employeeId ?? '',
  category: row?.category ?? '',
  description: row?.description ?? '',
  amount: row?.amount ?? 0,
  currency: row?.currency ?? currency,
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
  const { data } = useListEmployeeOptionsQuery();
  const companyCurrency = useCompanyCurrency();

  const employeeOptions = (data?.listEmployeeOptions ?? []).map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, companyCurrency),
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
      <RhfAutocomplete
        name="employeeId"
        label="Employee"
        options={employeeOptions}
        helperText="The person who spent the money and is to be reimbursed."
      />
      <RhfTextField
        name="category"
        label="Category"
        helperText="What kind of spend this is, e.g. Travel, Meals or Software."
      />
      <RhfTextField
        name="description"
        label="Description"
        multiline
        minRows={3}
        helperText="What was bought and why, so the approver can check it."
      />
      <RhfTextField
        name="amount"
        label="Amount"
        type="number"
        helperText="The amount claimed, as on the receipt; 0 or more."
      />
      <RhfCurrencyField helperText="The currency the money was spent in." />
      <RhfDatePicker
        name="incurredOn"
        label="Incurred on"
        helperText="The day the money was spent."
      />
      <RhfImageField
        name="receiptUrl"
        label="Receipt link"
        folder="expenses"
        editableUrl
        helperText="Upload a photo of the receipt, or paste a link to it."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={enumOptions(Object.values(ExpenseStatus))}
        helperText="Where the claim stands: submitted, approved, rejected or paid."
      />
      <RhfTextField
        name="approvedAmount"
        label="Approved amount"
        type="number"
        helperText="Optional. The amount approved for reimbursement; leave empty until it is approved."
      />
    </EntityForm>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import {
  RhfTextField,
  RhfDatePicker,
  RhfCurrencyField,
  useCompanyCurrency,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCreateMyExpenseClaimMutation } from '@exyconn/shell/graphql/generated';

const schema = z.object({
  category: z.string().trim().min(1, 'Category is required'),
  description: z.string().trim().min(1, 'Description is required'),
  amount: z.coerce.number({ message: 'Amount must be a number' }).positive('Must be more than 0'),
  currency: z.string().trim().min(1, 'Currency is required'),
  incurredOn: z.string().min(1, 'Date is required'),
  receiptUrl: z.string().trim().regex(HTTP_URL, 'Must be a valid link').or(z.literal('')),
});
type Values = z.infer<typeof schema>;

const initialValues = (currency: string) => ({
  category: '',
  description: '',
  amount: 0,
  currency,
  incurredOn: '',
  receiptUrl: '',
});

interface ExpenseClaimFormProps {
  onCancel: () => void;
  onDone: () => void;
}

/** React Hook Form + Zod form for an employee to file their own expense claim. */
export function ExpenseClaimForm({ onCancel, onDone }: Readonly<ExpenseClaimFormProps>) {
  const notify = useNotify();
  const [createClaim] = useCreateMyExpenseClaimMutation();
  const companyCurrency = useCompanyCurrency();
  const initial = initialValues(companyCurrency);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const onSubmit = async (values: Values) => {
    try {
      // An empty receipt link is "no receipt", which the API models as null.
      await createClaim({
        variables: { input: { ...values, receiptUrl: values.receiptUrl || null } },
      });
      notify('Expense claim submitted');
      methods.reset(initial);
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not submit the claim', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Submit claim"
    >
      <RhfTextField name="category" label="Category" />
      <RhfTextField name="description" label="Description" multiline minRows={2} />
      <RhfTextField name="amount" label="Amount" type="number" />
      <RhfCurrencyField />
      <RhfDatePicker name="incurredOn" label="Incurred on" />
      <RhfTextField name="receiptUrl" label="Receipt link (optional)" />
    </EntityForm>
  );
}

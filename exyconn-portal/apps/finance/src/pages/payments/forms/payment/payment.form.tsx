import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  PaymentMethod,
  useListInvoicesQuery,
  useRecordPaymentMutation,
} from '@exyconn/shell/graphql/generated';

const METHOD_OPTIONS = enumOptions(Object.values(PaymentMethod));

/** Invoices that can still take money. A draft has not gone out; a paid one is settled. */
const OPEN_STATUSES: ReadonlySet<string> = new Set(['SENT', 'PARTIALLY_PAID', 'OVERDUE']);

const schema = z.object({
  invoiceId: z.string().trim().min(1, 'Choose an invoice'),
  amount: z.coerce
    .number({ message: 'Amount must be a number' })
    .refine((value) => value !== 0, 'A payment of zero records nothing'),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().trim(),
  notes: z.string().trim(),
});
type Values = z.infer<typeof schema>;

interface PaymentFormProps {
  onDone: () => void;
  onCancel: () => void;
}

interface OpenInvoice {
  id: string;
  number: string;
  currency: string;
  balanceDue: number;
}

type Translate = ReturnType<typeof useT>;

/** What this payment will leave owing, said before it is recorded. */
function effectOf(t: Translate, amount: number, invoice: OpenInvoice | undefined): string {
  if (invoice === undefined) {
    return t('Choose an invoice to see what it will leave owing.');
  }
  const after = Math.round((invoice.balanceDue - amount) * 100) / 100;
  if (after < 0) {
    return t('That is {currency} {amount} more than is owed.', {
      currency: invoice.currency,
      amount: Math.abs(after).toLocaleString(),
    });
  }
  if (after === 0) {
    return t('{number} would be settled in full.', { number: invoice.number });
  }
  return t('{currency} {owed} → {currency} {remaining} still owing.', {
    currency: invoice.currency,
    owed: invoice.balanceDue.toLocaleString(),
    remaining: after.toLocaleString(),
  });
}

/** React Hook Form + Zod form to record a receipt against an invoice. */
export function PaymentForm({ onDone, onCancel }: Readonly<PaymentFormProps>) {
  const t = useT();
  const notify = useNotify();
  const { data } = useListInvoicesQuery();
  const [record] = useRecordPaymentMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoiceId: '',
      amount: 0,
      method: PaymentMethod.BankTransfer,
      reference: '',
      notes: '',
    },
  });

  const [invoiceId, amount] = useWatch({ control: methods.control, name: ['invoiceId', 'amount'] });

  const open: OpenInvoice[] = (data?.listInvoices ?? []).filter((invoice) =>
    OPEN_STATUSES.has(invoice.status),
  );
  const invoiceOptions: SelectOption[] = open.map((invoice) => ({
    value: invoice.id,
    label: `${invoice.number} — ${invoice.currency} ${invoice.balanceDue.toLocaleString()} owing`,
  }));
  const chosen = open.find((invoice) => invoice.id === invoiceId);

  const onSubmit = async (values: Values) => {
    try {
      const result = await record({ variables: { input: values } });
      const invoiceNumber = result.data?.recordPayment.invoiceNumber;
      if (invoiceNumber) {
        notify('Recorded against {number}.', 'success', { number: invoiceNumber });
      } else {
        notify('Recorded against the invoice.');
      }
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not record the payment', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Record"
    >
      <RhfSelect name="invoiceId" label="Invoice" options={invoiceOptions} />
      <RhfTextField
        name="amount"
        label="Amount"
        type="number"
        helperText="Enter a negative amount to record a refund."
      />
      <Text size="sm" color="text.secondary">
        {effectOf(t, Number(amount) || 0, chosen)}
      </Text>
      <RhfSelect name="method" label="Method" options={METHOD_OPTIONS} />
      <RhfTextField name="reference" label="Reference" helperText="UTR, cheque number, txn id…" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}

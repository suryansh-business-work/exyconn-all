import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  InvoiceStatus,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
} from '@exyconn/shell/graphql/generated';
import type { InvoiceRow } from './invoice.types';

const schema = z.object({
  number: z.string().trim().min(1, 'Invoice number is required'),
  clientId: z.string().trim().min(1, 'Client is required'),
  amount: z.coerce.number({ message: 'Amount must be a number' }).min(0, 'Must be ≥ 0'),
  currency: z.string().trim().min(1, 'Currency is required'),
  status: z.nativeEnum(InvoiceStatus),
  issuedDate: z.string().min(1, 'Issued date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: InvoiceRow | null): Values => ({
  number: row?.number ?? '',
  clientId: row?.clientId ?? '',
  amount: row?.amount ?? 0,
  currency: row?.currency ?? 'INR',
  status: row?.status ?? InvoiceStatus.Draft,
  issuedDate: row?.issuedDate ?? '',
  dueDate: row?.dueDate ?? '',
});

interface InvoiceFormProps {
  initial: InvoiceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an invoice. */
export function InvoiceForm({ initial, onDone, onCancel }: InvoiceFormProps) {
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Invoice',
    initial,
    create: (values: Values) => createInvoice({ variables: { input: values } }),
    update: (row, values) => updateInvoice({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="number" label="Invoice number" />
      <RhfTextField name="clientId" label="Client ID" />
      <RhfTextField name="amount" label="Amount" type="number" />
      <RhfTextField name="currency" label="Currency" />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(InvoiceStatus))} />
      <RhfDatePicker name="issuedDate" label="Issued date" />
      <RhfDatePicker name="dueDate" label="Due date" />
    </EntityForm>
  );
}

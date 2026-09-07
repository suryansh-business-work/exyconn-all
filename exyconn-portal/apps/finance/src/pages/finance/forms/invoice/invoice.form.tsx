import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfAutocomplete,
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  InvoiceStatus,
  useCreateInvoiceMutation,
  useListClientsQuery,
  useUpdateInvoiceMutation,
} from '@exyconn/shell/graphql/generated';
import { InvoiceLinesFields } from './invoice-lines.fields';
import type { InvoiceRow } from './invoice.types';

const lineSchema = z.object({
  description: z.string().trim().min(1, 'Describe the line'),
  quantity: z.coerce.number({ message: 'Must be a number' }).min(0, 'Must be ≥ 0'),
  rate: z.coerce.number({ message: 'Must be a number' }).min(0, 'Must be ≥ 0'),
  taxPercent: z.coerce
    .number({ message: 'Must be a number' })
    .min(0, 'Must be ≥ 0')
    .max(100, 'Must be ≤ 100'),
});

const schema = z.object({
  number: z.string().trim().min(1, 'Invoice number is required'),
  clientId: z.string().trim().min(1, 'Client is required'),
  lines: z.array(lineSchema),
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
  lines: (row?.lines ?? []).map(({ description, quantity, rate, taxPercent }) => ({
    description,
    quantity,
    rate,
    taxPercent,
  })),
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

/**
 * React Hook Form + Zod form to create or update an invoice.
 *
 * The client is picked from the client list, never typed: the server looks its name up
 * from the id and writes it onto the invoice. The amount is the lines when there are any.
 */
export function InvoiceForm({ initial, onDone, onCancel }: Readonly<InvoiceFormProps>) {
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const { data: clientsData } = useListClientsQuery();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });
  const currency = useWatch({ control: methods.control, name: 'currency' }) || 'INR';

  const clientOptions = (clientsData?.listClients ?? []).map((client) => ({
    value: client.id,
    label: `${client.name} · ${client.company}`,
  }));

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
      <RhfAutocomplete name="clientId" label="Client" options={clientOptions} />
      <RhfTextField name="currency" label="Currency" />
      <InvoiceLinesFields currency={currency} />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(InvoiceStatus))} />
      <RhfDatePicker name="issuedDate" label="Issued date" />
      <RhfDatePicker name="dueDate" label="Due date" />
    </EntityForm>
  );
}

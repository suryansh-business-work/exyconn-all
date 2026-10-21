import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { currencyField } from '@exyconn/shell/utils/currencyField';
import {
  RhfAutocomplete,
  RhfSwitch,
  RhfTextField,
  useCompanyCurrency,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { gstStateCodeField } from '@exyconn/shell/utils/gstFields';
import { useGstStateOptions } from '@exyconn/shell/hooks/useGstStateOptions';
import {
  RecurrenceFrequency,
  useCreateRecurringInvoiceMutation,
  useListClientsQuery,
  useUpdateRecurringInvoiceMutation,
} from '@exyconn/shell/graphql/generated';
import { InvoiceLinesFields } from '../invoice/invoice-lines.fields';
import { RecurringScheduleFields } from './recurring-invoice.fields';
import type { RecurringInvoiceRow } from './recurring-invoice.types';

const lineSchema = z.object({
  description: z.string().trim().min(1, 'Describe the line'),
  quantity: z.coerce.number({ message: 'Must be a number' }).min(0, 'Must be ≥ 0'),
  rate: z.coerce.number({ message: 'Must be a number' }).min(0, 'Must be ≥ 0'),
  taxPercent: z.coerce
    .number({ message: 'Must be a number' })
    .min(0, 'Must be ≥ 0')
    .max(100, 'Must be ≤ 100'),
  hsnSac: z.string().trim(),
});

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name this retainer'),
    clientId: z.string().trim().min(1, 'Client is required'),
    // At least one line: a retainer with nothing on it bills nothing, every period, silently.
    lines: z.array(lineSchema).min(1, 'Add at least one line'),
    currency: currencyField,
    placeOfSupplyStateCode: gstStateCodeField,
    frequency: z.enum(RecurrenceFrequency),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string(),
    dueDays: z.coerce
      .number({ message: 'Must be a number' })
      .int()
      .min(0, 'Must be ≥ 0')
      .max(365, 'Must be ≤ 365'),
    active: z.boolean(),
  })
  .refine((values) => !values.endDate || values.endDate >= values.startDate, {
    message: 'The end date cannot be before the start date',
    path: ['endDate'],
  });
type Values = z.infer<typeof schema>;

const toInitial = (row: RecurringInvoiceRow | null, currency: string): Values => ({
  name: row?.name ?? '',
  clientId: row?.clientId ?? '',
  lines: (row?.lines ?? []).map(({ description, quantity, rate, taxPercent, hsnSac }) => ({
    description,
    quantity,
    rate,
    taxPercent,
    hsnSac,
  })),
  currency: row?.currency ?? currency,
  placeOfSupplyStateCode: row?.placeOfSupplyStateCode ?? '',
  frequency: row?.frequency ?? RecurrenceFrequency.Monthly,
  startDate: row?.startDate ?? '',
  endDate: row?.endDate ?? '',
  dueDays: row?.dueDays ?? 30,
  active: row?.active ?? true,
});

interface RecurringInvoiceFormProps {
  initial: RecurringInvoiceRow | null;
  /** Runs after a successful save — closes the dialog and reloads the list. */
  onDone: () => void;
  onCancel: () => void;
}

/**
 * A standing instruction to raise the same invoice every period.
 *
 * `nextRunAt` is deliberately absent: the schedule owns where it has got to, and letting
 * somebody type it is how a period gets billed twice or skipped. Editing a retainer changes
 * what the NEXT invoice says — the ones already issued keep the figures they were raised on.
 */
export function RecurringInvoiceForm({
  initial,
  onDone,
  onCancel,
}: Readonly<RecurringInvoiceFormProps>) {
  const companyCurrency = useCompanyCurrency();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, companyCurrency),
  });
  // The lines editor prints each line's total, so it needs the currency being edited.
  const currency = useWatch({ control: methods.control, name: 'currency' });
  const { data: clientsData } = useListClientsQuery();
  const gstStateOptions = useGstStateOptions();
  const [createRecurring] = useCreateRecurringInvoiceMutation();
  const [updateRecurring] = useUpdateRecurringInvoiceMutation();

  const clientOptions = (clientsData?.listClients ?? []).map((client) => ({
    value: client.id,
    label: client.name,
  }));

  /** An empty end date means "runs until somebody pauses it", which the server stores as null. */
  const toInput = (values: Values) => ({ ...values, endDate: values.endDate || null });

  const save = useEntitySave<Values, RecurringInvoiceRow>({
    label: 'Recurring invoice',
    initial,
    create: (values) => createRecurring({ variables: { input: toInput(values) } }),
    update: (row, values) => updateRecurring({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={save.onSubmit} isEdit={save.isEdit} onCancel={onCancel}>
      <RhfTextField
        name="name"
        label="Name"
        helperText="For this screen only — never printed on the invoice."
      />
      <RhfAutocomplete
        name="clientId"
        label="Client"
        options={clientOptions}
        helperText="Who every invoice from this retainer is addressed to."
      />
      <InvoiceLinesFields currency={currency} />
      <RecurringScheduleFields gstStateOptions={gstStateOptions} />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}

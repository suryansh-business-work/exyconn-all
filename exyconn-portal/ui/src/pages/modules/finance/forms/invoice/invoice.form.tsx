import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  InvoiceStatus,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
} from '@/graphql/generated';
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
  const notify = useNotify();
  const [createInvoice] = useCreateInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateInvoice({ variables: { id: initial.id, input: values } });
      else await createInvoice({ variables: { input: values } });
      notify(`Invoice ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="number" label="Invoice number" />
          <RhfTextField name="clientId" label="Client ID" />
          <RhfTextField name="amount" label="Amount" type="number" />
          <RhfTextField name="currency" label="Currency" />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(InvoiceStatus))}
          />
          <RhfDatePicker name="issuedDate" label="Issued date" />
          <RhfDatePicker name="dueDate" label="Due date" />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}

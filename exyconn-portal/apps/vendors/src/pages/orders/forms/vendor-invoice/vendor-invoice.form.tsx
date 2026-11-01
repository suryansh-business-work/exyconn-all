import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { Alert, Text } from '@exyconn/shell/components/ui';
import { RhfDatePicker, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { RhfAttachmentPicker } from '@exyconn/shell/components/upload';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import {
  useVendorSubmitInvoiceMutation,
  useVendorUploadInvoiceFileMutation,
} from '@exyconn/shell/graphql/generated';
import {
  toVendorInvoiceInput,
  vendorInvoiceSchema,
  type VendorInvoiceFormInput,
  type VendorInvoiceFormValues,
} from './vendor-invoice.types';

/** The CDN folder vendor invoice documents are grouped under. */
const UPLOAD_FOLDER = 'vendor-invoices';

interface VendorInvoiceFormProps {
  order: { id: string; number: string; total: number; currency: string };
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Sends an invoice against one purchase order: the supplier's number, dates and amount, and the
 * invoice document itself. The buyer reviews it; an approved one is paid through their Finance.
 */
export function VendorInvoiceForm({ order, onDone, onCancel }: Readonly<VendorInvoiceFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [submit] = useVendorSubmitInvoiceMutation();
  const [uploadFile] = useVendorUploadInvoiceFileMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<VendorInvoiceFormInput, unknown, VendorInvoiceFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(vendorInvoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: '',
      amount: order.total,
      notes: '',
      files: [],
    },
  });
  const filesError = methods.formState.errors.files?.message;

  const upload = async (file: File): Promise<string> => {
    const { data } = await uploadFile({
      variables: { file: await fileToDataUrl(file), fileName: file.name },
    });
    if (!data?.vendorUploadInvoiceFile) throw new Error(t('Upload returned no URL'));
    return data.vendorUploadInvoiceFile;
  };

  const onSubmit = async (values: VendorInvoiceFormValues) => {
    setError(null);
    try {
      await submit({ variables: { input: toVendorInvoiceInput(order.id, values) } });
      notify('Invoice {number} sent for review', 'success', { number: values.invoiceNumber });
      onDone();
    } catch (err) {
      setError(errorMessage(err, t('The invoice could not be sent')));
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Send invoice"
    >
      {error && <Alert severity="error">{error}</Alert>}
      <RhfTextField
        name="invoiceNumber"
        label={t('Invoice number')}
        helperText="Your own invoice number, as printed on the document."
      />
      <RhfDatePicker name="invoiceDate" label="Invoice date" />
      <RhfDatePicker
        name="dueDate"
        label="Due date"
        helperText="When payment is due under your terms."
      />
      <RhfTextField
        name="amount"
        type="number"
        label={t('Amount ({currency})', { currency: order.currency })}
        helperText="The invoice total, tax included, in the order's currency."
      />
      <RhfTextField name="notes" label={t('Notes')} multiline minRows={2} />
      <RhfAttachmentPicker
        name="files"
        folder={UPLOAD_FOLDER}
        uploader={upload}
        helperText="The invoice itself — one PDF or image."
      />
      {filesError && (
        <Text size="caption" color="error" role="alert">
          {t(filesError)}
        </Text>
      )}
    </EntityForm>
  );
}

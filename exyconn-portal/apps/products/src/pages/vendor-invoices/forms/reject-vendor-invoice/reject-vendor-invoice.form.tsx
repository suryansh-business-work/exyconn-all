import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { Alert } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useRejectVendorInvoiceMutation } from '@exyconn/shell/graphql/generated';
import {
  rejectVendorInvoiceSchema,
  type RejectVendorInvoiceValues,
  type VendorInvoiceRow,
} from './reject-vendor-invoice.types';

interface RejectVendorInvoiceFormProps {
  invoice: VendorInvoiceRow;
  onDone: () => void;
  onCancel: () => void;
}

/** Sends a supplier's invoice back with the reason; the supplier sees it in the vendor portal. */
export function RejectVendorInvoiceForm({
  invoice,
  onDone,
  onCancel,
}: Readonly<RejectVendorInvoiceFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [reject] = useRejectVendorInvoiceMutation();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<RejectVendorInvoiceValues>({
    mode: 'onTouched',
    resolver: zodResolver(rejectVendorInvoiceSchema),
    defaultValues: { reason: '' },
  });

  const onSubmit = async ({ reason }: RejectVendorInvoiceValues) => {
    setError(null);
    try {
      await reject({ variables: { id: invoice.id, reason } });
      notify('Invoice {number} sent back', 'success', { number: invoice.invoiceNumber });
      onDone();
    } catch (err) {
      setError(errorMessage(err, t('The invoice could not be rejected')));
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Reject invoice"
    >
      {error && <Alert severity="error">{error}</Alert>}
      <RhfTextField
        name="reason"
        label={t('Reason')}
        multiline
        minRows={3}
        helperText="The supplier sees this, so say what to correct."
      />
    </EntityForm>
  );
}

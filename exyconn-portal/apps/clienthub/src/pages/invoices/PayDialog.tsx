import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack, Text } from '@exyconn/shell/components/ui';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  PaymentGateway,
  useClientHubPayInvoiceMutation,
  useClientHubPaymentOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { money } from '../money';

export interface PayableInvoice {
  id: string;
  number: string;
  balance: number;
  currency: string;
}

interface PayDialogProps {
  invoice: PayableInvoice | null;
  onClose: () => void;
}

/**
 * Pays an invoice's whole balance on the gateway's own secure page — Stripe for cards,
 * Razorpay for UPI, cards and netbanking. Card details never touch Exyconn's servers; the
 * gateway confirms the payment back and the invoice is marked paid.
 */
export function PayDialog({ invoice, onClose }: Readonly<PayDialogProps>) {
  const t = useT();
  const { data, loading } = useClientHubPaymentOptionsQuery({ skip: !invoice });
  const [pay] = useClientHubPayInvoiceMutation();
  const [busy, setBusy] = useState<PaymentGateway | null>(null);
  const [error, setError] = useState<string | null>(null);
  const options = data?.clientHubPaymentOptions;
  const noneAvailable = !loading && options && !options.stripe && !options.razorpay;

  const start = async (gateway: PaymentGateway) => {
    if (!invoice) return;
    setBusy(gateway);
    setError(null);
    try {
      const result = await pay({ variables: { id: invoice.id, gateway } });
      const url = result.data?.clientHubPayInvoice.url;
      if (url) globalThis.location.assign(url);
    } catch (err) {
      setError(errorMessage(err, t('The payment page could not be opened.')));
      setBusy(null);
    }
  };

  const title = invoice ? t('Pay invoice {number}', { number: invoice.number }) : '';

  return (
    <CrudDialog open={invoice !== null} title={title} onClose={onClose}>
      {invoice && (
        <Stack spacing={2}>
          <Text>
            {t('Amount due: {amount}', { amount: money(invoice.balance, invoice.currency) })}
          </Text>
          {error && <Alert severity="error">{error}</Alert>}
          {noneAvailable && (
            <Alert severity="info">
              {t('Online payment is not available for this invoice. Please pay by bank transfer.')}
            </Alert>
          )}
          {options?.stripe && (
            <Button
              variant="contained"
              size="large"
              startIcon={<CreditCardIcon />}
              loading={busy === PaymentGateway.Stripe}
              disabled={busy !== null}
              onClick={() => start(PaymentGateway.Stripe)}
            >
              {t('Pay by card (Stripe)')}
            </Button>
          )}
          {options?.razorpay && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<AccountBalanceIcon />}
              loading={busy === PaymentGateway.Razorpay}
              disabled={busy !== null}
              onClick={() => start(PaymentGateway.Razorpay)}
            >
              {t('Pay with UPI, card or netbanking (Razorpay)')}
            </Button>
          )}
          <Text size="caption" color="text.secondary">
            {t('You are taken to the gateway’s secure page and brought back here when it is done.')}
          </Text>
        </Stack>
      )}
    </CrudDialog>
  );
}

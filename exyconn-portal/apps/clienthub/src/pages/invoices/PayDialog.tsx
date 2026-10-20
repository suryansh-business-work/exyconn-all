import { useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack, Text } from '@exyconn/shell/components/ui';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PublicIcon from '@mui/icons-material/Public';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  PaymentGateway,
  useClientHubPayInvoiceMutation,
  useClientHubPaymentOptionsQuery,
  type ClientHubPaymentOptionsQuery,
} from '@exyconn/shell/graphql/generated';
import { money } from '../money';
import { PATHS } from '../../paths';

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

type PaymentOptions = Omit<ClientHubPaymentOptionsQuery['clientHubPaymentOptions'], '__typename'>;

interface GatewayChoice {
  gateway: PaymentGateway;
  /** The flag in the payment options that says this gateway is set up. */
  option: keyof PaymentOptions;
  label: string;
  icon: ReactNode;
}

/** Every way to pay, in the order they are offered; the first available one is the main button. */
const GATEWAY_CHOICES: readonly GatewayChoice[] = [
  {
    gateway: PaymentGateway.Stripe,
    option: 'stripe',
    label: 'Pay by card (Stripe)',
    icon: <CreditCardIcon />,
  },
  {
    gateway: PaymentGateway.Razorpay,
    option: 'razorpay',
    label: 'Pay with UPI, card or netbanking (Razorpay)',
    icon: <AccountBalanceIcon />,
  },
  {
    gateway: PaymentGateway.Paypal,
    option: 'paypal',
    label: 'Pay with PayPal',
    icon: <AccountBalanceWalletIcon />,
  },
  {
    gateway: PaymentGateway.Payoneer,
    option: 'payoneer',
    label: 'Pay internationally (Payoneer)',
    icon: <PublicIcon />,
  },
];

/**
 * Pays an invoice's whole balance on the gateway's own secure page — Stripe for cards,
 * Razorpay for UPI, cards and netbanking, PayPal, or Payoneer for international payments.
 * Card details never touch Exyconn's servers; the gateway confirms the payment back and the
 * invoice is marked paid.
 */
export function PayDialog({ invoice, onClose }: Readonly<PayDialogProps>) {
  const t = useT();
  const {
    data,
    loading,
    error: optionsError,
  } = useClientHubPaymentOptionsQuery({ skip: !invoice });
  const [pay] = useClientHubPayInvoiceMutation();
  const [busy, setBusy] = useState<PaymentGateway | null>(null);
  const [error, setError] = useState<string | null>(null);
  const options = data?.clientHubPaymentOptions;
  const available = GATEWAY_CHOICES.filter((choice) => options?.[choice.option]);
  const noneAvailable = !loading && options && available.length === 0;

  const start = async (invoiceId: string, gateway: PaymentGateway) => {
    setBusy(gateway);
    setError(null);
    try {
      const result = await pay({ variables: { id: invoiceId, gateway } });
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
          {optionsError && (
            <Alert severity="error">
              {errorMessage(
                optionsError,
                t('The ways to pay could not be loaded. Try again shortly.'),
              )}
            </Alert>
          )}
          {noneAvailable && (
            <Alert
              severity="info"
              action={
                <Button component={RouterLink} to={PATHS.support} color="inherit" size="small">
                  {t('Contact us')}
                </Button>
              }
            >
              {t(
                'Online payment is not set up for this invoice yet. Pay by bank transfer using the details on the invoice PDF, or contact us and we will send you a payment link.',
              )}
            </Alert>
          )}
          {available.map((choice) => (
            <Button
              key={choice.gateway}
              variant={choice === available[0] ? 'contained' : 'outlined'}
              size="large"
              startIcon={choice.icon}
              loading={busy === choice.gateway}
              disabled={busy !== null}
              onClick={() => start(invoice.id, choice.gateway)}
            >
              {t(choice.label)}
            </Button>
          ))}
          <Text size="caption" color="text.secondary">
            {t('You are taken to the gateway’s secure page and brought back here when it is done.')}
          </Text>
        </Stack>
      )}
    </CrudDialog>
  );
}

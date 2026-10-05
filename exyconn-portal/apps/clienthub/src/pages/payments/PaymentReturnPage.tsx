import { useEffect } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Heading,
  Text,
} from '@exyconn/shell/components/ui';
import {
  PaymentAttemptStatus,
  useClientHubPaymentAttemptQuery,
} from '@exyconn/shell/graphql/generated';
import { money } from '../money';
import { PATHS } from '../../paths';

/** How often to ask whether the gateway has confirmed the payment yet. */
const POLL_MS = 3000;

/**
 * Where the gateway sends the client back. The payment counts once the gateway's signed
 * webhook confirms it, which can lag the redirect by a few seconds — so this page waits for
 * that, rather than trusting the redirect itself.
 */
export function PaymentReturnPage() {
  const t = useT();
  const [params] = useSearchParams();
  const id = params.get('attempt') ?? '';
  const { data, error, stopPolling } = useClientHubPaymentAttemptQuery({
    variables: { id },
    skip: id === '',
    pollInterval: POLL_MS,
  });
  const attempt = data?.clientHubPaymentAttempt;
  const pending = !attempt || attempt.status === PaymentAttemptStatus.Pending;

  // Settled either way: nothing more will change, so stop asking.
  useEffect(() => {
    if (!pending || error) stopPolling();
  }, [pending, error, stopPolling]);

  let body = (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <CircularProgress size={24} />
      <Text>{t('Confirming your payment with the gateway…')}</Text>
    </Stack>
  );
  if (error || id === '') {
    body = <Alert severity="error">{t('We could not find this payment.')}</Alert>;
  } else if (attempt?.status === PaymentAttemptStatus.Paid) {
    body = (
      <Alert severity="success">
        {t('Thank you! {amount} was received for invoice {number}.', {
          amount: money(attempt.amount, attempt.currency),
          number: attempt.invoiceNumber,
        })}
      </Alert>
    );
  } else if (attempt?.status === PaymentAttemptStatus.Review) {
    body = (
      <Alert severity="info">
        {t(
          'Your payment was received. Our finance team will confirm it on invoice {number} shortly.',
          {
            number: attempt.invoiceNumber,
          },
        )}
      </Alert>
    );
  } else if (!pending) {
    body = (
      <Alert severity="warning">{t('This payment was not completed. You can try again.')}</Alert>
    );
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <Heading level={4}>{t('Payment')}</Heading>
      {body}
      <Stack direction="row" spacing={1.5}>
        <Button component={RouterLink} to={PATHS.invoices} variant="contained">
          {t('Back to invoices')}
        </Button>
        <Button component={RouterLink} to={PATHS.transactions}>
          {t('See transactions')}
        </Button>
      </Stack>
    </Stack>
  );
}

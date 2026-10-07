import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { PaymentAttemptStatus, PaymentGateway } from '@exyconn/shell/graphql/generated';
import { PaymentReturnPage } from '../../../../src/pages/payments/PaymentReturnPage';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ useClientHubPaymentAttemptQuery: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const stopPolling = vi.fn();

const attempt = (status: PaymentAttemptStatus, gateway = PaymentGateway.Stripe) => ({
  clientHubPaymentAttempt: {
    id: 'pa-1',
    gateway,
    invoiceNumber: 'INV-9',
    amount: 120,
    currency: 'USD',
    status,
    paidAt: null,
  },
});

function answer(result: Readonly<{ data?: ReturnType<typeof attempt>; error?: Error }>) {
  gql.useClientHubPaymentAttemptQuery.mockReturnValue({ stopPolling, ...result });
}

function renderReturn(route = '/payments/return?attempt=pa-1') {
  renderWithProviders(<PaymentReturnPage />, { route });
}

describe('PaymentReturnPage', () => {
  afterEach(() => vi.clearAllMocks());

  it('polls the attempt named in the return address every few seconds', () => {
    answer({});
    renderReturn();
    expect(gql.useClientHubPaymentAttemptQuery).toHaveBeenCalledWith({
      variables: { id: 'pa-1' },
      skip: false,
      pollInterval: 3000,
    });
    expect(screen.getByText('Confirming your payment with the gateway…')).toBeInTheDocument();
    expect(stopPolling).not.toHaveBeenCalled();
  });

  it('names the gateway while it waits for the confirmation', () => {
    answer({ data: attempt(PaymentAttemptStatus.Pending, PaymentGateway.Paypal) });
    renderReturn();
    expect(screen.getByText('Confirming your payment with PayPal…')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(stopPolling).not.toHaveBeenCalled();
  });

  it('thanks the client once the gateway confirms, and stops asking', () => {
    answer({ data: attempt(PaymentAttemptStatus.Paid) });
    renderReturn();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Thank you! $120.00 was received for invoice INV-9.',
    );
    expect(stopPolling).toHaveBeenCalled();
  });

  it('says finance will confirm a payment held for review', () => {
    answer({ data: attempt(PaymentAttemptStatus.Review, PaymentGateway.Payoneer) });
    renderReturn();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your payment was received. Our finance team will confirm it on invoice INV-9 shortly.',
    );
    expect(stopPolling).toHaveBeenCalled();
  });

  it('offers another try when the payment was not completed', () => {
    answer({ data: attempt(PaymentAttemptStatus.Expired, PaymentGateway.Razorpay) });
    renderReturn();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This payment was not completed. You can try again.',
    );
    expect(stopPolling).toHaveBeenCalled();
  });

  it('reports a payment the server cannot find, and stops asking', () => {
    answer({ error: new Error('Not found') });
    renderReturn();
    expect(screen.getByRole('alert')).toHaveTextContent('We could not find this payment.');
    expect(stopPolling).toHaveBeenCalled();
  });

  it('does not ask at all when the return address names no attempt', () => {
    answer({});
    renderReturn('/payments/return');
    expect(gql.useClientHubPaymentAttemptQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: '' }, skip: true }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('We could not find this payment.');
  });

  it('leads back to the invoices and on to the transactions', () => {
    answer({ data: attempt(PaymentAttemptStatus.Paid) });
    renderReturn();
    expect(screen.getByRole('link', { name: 'Back to invoices' })).toHaveAttribute(
      'href',
      '/invoices',
    );
    expect(screen.getByRole('link', { name: 'See transactions' })).toHaveAttribute(
      'href',
      '/transactions',
    );
  });
});

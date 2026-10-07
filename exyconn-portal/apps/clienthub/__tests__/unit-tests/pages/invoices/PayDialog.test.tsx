import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentGateway } from '@exyconn/shell/graphql/generated';
import { PayDialog, type PayableInvoice } from '../../../../src/pages/invoices/PayDialog';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  useClientHubPaymentOptionsQuery: vi.fn(),
  useClientHubPayInvoiceMutation: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

type Flags = Partial<Record<'stripe' | 'razorpay' | 'paypal' | 'payoneer', boolean>>;

const INVOICE: PayableInvoice = { id: 'inv-7', number: 'INV-7', balance: 300, currency: 'USD' };
const LABELS = {
  stripe: 'Pay by card (Stripe)',
  razorpay: 'Pay with UPI, card or netbanking (Razorpay)',
  paypal: 'Pay with PayPal',
  payoneer: 'Pay internationally (Payoneer)',
};
const pay = vi.fn();
const assign = vi.fn();

function offer(flags: Flags) {
  gql.useClientHubPaymentOptionsQuery.mockReturnValue({
    loading: false,
    data: {
      clientHubPaymentOptions: {
        stripe: false,
        razorpay: false,
        paypal: false,
        payoneer: false,
        ...flags,
      },
    },
  });
}

function renderDialog(invoice: PayableInvoice | null = INVOICE) {
  renderWithProviders(<PayDialog invoice={invoice} onClose={vi.fn()} />);
  return userEvent.setup();
}

describe('PayDialog', () => {
  beforeEach(() => {
    offer({ stripe: true, razorpay: true, paypal: true, payoneer: true });
    gql.useClientHubPayInvoiceMutation.mockReturnValue([pay, {}]);
    // jsdom cannot navigate, so the hand-off to the gateway meets a stand-in location.
    vi.stubGlobal('location', { ...globalThis.location, assign });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('stays closed, and asks nothing, without an invoice', () => {
    renderDialog(null);
    expect(screen.queryByText(/Amount due/)).not.toBeInTheDocument();
    expect(gql.useClientHubPaymentOptionsQuery).toHaveBeenCalledWith({ skip: true });
  });

  it('offers every configured gateway in order, the first as the main button', () => {
    renderDialog();
    expect(screen.getByText('Pay invoice INV-7')).toBeInTheDocument();
    expect(screen.getByText('Amount due: $300.00')).toBeInTheDocument();
    const buttons = Object.values(LABELS).map((name) => screen.getByRole('button', { name }));
    expect(buttons[0]).toHaveClass('MuiButton-contained');
    buttons.slice(1).forEach((button) => expect(button).toHaveClass('MuiButton-outlined'));
    expect(gql.useClientHubPaymentOptionsQuery).toHaveBeenCalledWith({ skip: false });
  });

  it('offers only the gateways that are set up', () => {
    offer({ paypal: true, payoneer: true });
    renderDialog();
    expect(screen.queryByRole('button', { name: LABELS.stripe })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: LABELS.razorpay })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: LABELS.paypal })).toHaveClass('MuiButton-contained');
    expect(screen.getByRole('button', { name: LABELS.payoneer })).toHaveClass('MuiButton-outlined');
  });

  it('points to a bank transfer when no gateway is set up', () => {
    offer({});
    renderDialog();
    expect(
      screen.getByText(
        'Online payment is not available for this invoice. Please pay by bank transfer.',
      ),
    ).toBeInTheDocument();
  });

  it.each([
    ['while the options load', true],
    ['when the options never arrived', false],
  ])('says nothing about gateways %s', (_when, loading) => {
    gql.useClientHubPaymentOptionsQuery.mockReturnValue({ data: undefined, loading });
    renderDialog();
    expect(screen.getByText('Amount due: $300.00')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: LABELS.stripe })).not.toBeInTheDocument();
    expect(screen.queryByText(/Please pay by bank transfer/)).not.toBeInTheDocument();
  });

  it("sends the client to the gateway's page and locks the other choices meanwhile", async () => {
    const url = 'https://checkout.example.test/session/1';
    pay.mockResolvedValue({ data: { clientHubPayInvoice: { attemptId: 'pa-1', url } } });
    const user = renderDialog();
    await user.click(screen.getByRole('button', { name: LABELS.razorpay }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith(url));
    expect(pay).toHaveBeenCalledWith({
      variables: { id: 'inv-7', gateway: PaymentGateway.Razorpay },
    });
    expect(screen.getByRole('button', { name: LABELS.stripe })).toBeDisabled();
  });

  it('stays put when the server returns no payment page', async () => {
    pay.mockResolvedValue({ data: undefined });
    const user = renderDialog();
    await user.click(screen.getByRole('button', { name: LABELS.stripe }));
    await waitFor(() => expect(pay).toHaveBeenCalledTimes(1));
    expect(assign).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("shows the server's reason and frees the buttons when the page cannot be opened", async () => {
    pay.mockRejectedValue(new Error('This invoice is already paid'));
    const user = renderDialog();
    await user.click(screen.getByRole('button', { name: LABELS.stripe }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This invoice is already paid');
    expect(screen.getByRole('button', { name: LABELS.paypal })).toBeEnabled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    pay.mockRejectedValue('gateway timeout');
    const user = renderDialog();
    await user.click(screen.getByRole('button', { name: LABELS.payoneer }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The payment page could not be opened.',
    );
  });
});

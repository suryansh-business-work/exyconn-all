import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutProvider } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { BillingCheckoutForm } from '../../../../src/pages/billing/forms/billing-checkout';
import { plan } from './billing.fixtures';

const hooks = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useStartBillingCheckoutMutation: () => [hooks.start],
}));

const assign = vi.fn();
beforeEach(() => {
  vi.stubGlobal('location', { ...globalThis.location, assign });
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

function mount({
  providers = [CheckoutProvider.Stripe, CheckoutProvider.Razorpay],
  preferredCurrency = 'INR',
  chosen = plan(),
} = {}) {
  const onCancel = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <BillingCheckoutForm
      plan={chosen}
      providers={providers}
      preferredCurrency={preferredCurrency}
      onCancel={onCancel}
    />,
  );
  return { user, onCancel };
}

const pay = () => screen.getByRole('button', { name: 'Continue to payment' });

describe('BillingCheckoutForm', () => {
  it('says online payment is not set up when no gateway is configured', () => {
    mount({ providers: [] });
    expect(screen.getByText(/Online payment is not set up yet/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue to payment' })).toBeNull();
  });

  it('starts in the company’s own currency and the first gateway, then sends the administrator to pay', async () => {
    hooks.start.mockResolvedValue({ data: { startBillingCheckout: 'https://pay.test/s/1' } });
    const { user } = mount();
    expect(screen.getByRole('combobox', { name: /Price/ })).toHaveTextContent(/3,999/);
    expect(screen.getByRole('combobox', { name: /Pay with/ })).toHaveTextContent('Card (Stripe)');

    await user.click(pay());

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://pay.test/s/1'));
    expect(hooks.start).toHaveBeenCalledWith({
      variables: {
        input: { planId: 'plan-growth', currency: 'INR', provider: CheckoutProvider.Stripe },
      },
    });
  });

  it('pays with the gateway and currency picked', async () => {
    hooks.start.mockResolvedValue({ data: { startBillingCheckout: 'https://rzp.test/1' } });
    const { user } = mount({ preferredCurrency: 'EUR' });
    expect(screen.getByRole('combobox', { name: /Price/ })).toHaveTextContent(/49/);

    await user.click(screen.getByRole('combobox', { name: /Pay with/ }));
    await user.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: 'Card, UPI or netbanking (Razorpay)',
      }),
    );
    await user.click(pay());

    await waitFor(() =>
      expect(hooks.start).toHaveBeenCalledWith({
        variables: {
          input: { planId: 'plan-growth', currency: 'USD', provider: CheckoutProvider.Razorpay },
        },
      }),
    );
  });

  it('stays put when the server returns no address', async () => {
    hooks.start.mockResolvedValue({ data: null });
    const { user } = mount();
    await user.click(pay());
    await waitFor(() => expect(hooks.start).toHaveBeenCalled());
    expect(assign).not.toHaveBeenCalled();
  });

  it('says why the checkout could not be opened', async () => {
    hooks.start.mockRejectedValue(new Error('This plan is not sold in INR.'));
    const { user } = mount();
    await user.click(pay());
    expect(await screen.findByText('This plan is not sold in INR.')).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it('falls back to a general message for a failure with no message', async () => {
    hooks.start.mockRejectedValue('boom');
    const { user } = mount();
    await user.click(pay());
    expect(await screen.findByText('The checkout could not be opened')).toBeInTheDocument();
  });

  it('asks for a price when the plan has none to offer', async () => {
    const { user } = mount({ chosen: plan({ prices: [] }) });
    await user.click(pay());
    expect(await screen.findByText('Pick a currency')).toBeInTheDocument();
    expect(hooks.start).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    const { user, onCancel } = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

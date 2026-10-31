import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutProvider, SubscriptionStatus } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { BillingPage } from '../../../../src/pages/billing';
import { overview, plan, subscription } from './billing.fixtures';

const hooks = vi.hoisted(() => ({
  result: {} as { data?: unknown; loading: boolean; error?: Error },
  refetch: vi.fn(),
  cancel: vi.fn(),
  cancelling: false,
  checkout: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useBillingOverviewQuery: () => ({ ...hooks.result, refetch: hooks.refetch }),
  useCancelBillingSubscriptionMutation: () => [hooks.cancel, { loading: hooks.cancelling }],
  useStartBillingCheckoutMutation: () => [hooks.checkout],
}));

const showing = (value = overview()) => {
  hooks.result = { data: { billingOverview: value }, loading: false };
};

beforeEach(() => {
  showing();
  hooks.cancelling = false;
  hooks.refetch.mockResolvedValue({});
});
afterEach(() => {
  vi.resetAllMocks();
});

function mount(route = '/admin/billing') {
  const user = userEvent.setup();
  renderWithProviders(<BillingPage />, { route });
  return user;
}

const cardOf = (name: string) =>
  screen.getByRole('heading', { name, level: 6 }).closest('.MuiCard-root') as HTMLElement;

describe('BillingPage', () => {
  it('waits for the overview', () => {
    hooks.result = { data: undefined, loading: true };
    mount();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Billing' })).toBeNull();
  });

  it('says why billing could not be loaded', () => {
    hooks.result = { data: undefined, loading: false, error: new Error('Forbidden') };
    mount();
    expect(screen.getByRole('alert')).toHaveTextContent('Forbidden');
  });

  it('shows the plan, its trial and what is used against its limits', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Billing' })).toBeInTheDocument();
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
    expect(screen.getByText('Free trial')).toBeInTheDocument();
    expect(screen.getAllByText('CRM, HR')).toHaveLength(2);
    expect(within(cardOf('Growth')).getByRole('button', { name: 'Current plan' })).toBeDisabled();
    expect(within(cardOf('Scale')).getByRole('button', { name: 'Choose' })).toBeEnabled();
    expect(within(cardOf('Scale')).getByText('Every module')).toBeInTheDocument();
    expect(within(cardOf('Scale')).getByText('Unlimited AI')).toBeInTheDocument();
    expect(within(cardOf('Scale')).getByText(/per year/)).toBeInTheDocument();
    expect(screen.queryByText(/Your subscription has ended/)).toBeNull();
  });

  it('says a company on no plan has no limits, and offers no cancel', () => {
    showing(overview({ subscription: null, plan: null, seatsUsed: 7, aiSpentThisMonthUsd: 0 }));
    mount();
    expect(screen.getByText('No plan — no limits apply')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel subscription' })).toBeNull();
  });

  it('shows a renewal date and a pending cancellation, and offers no second cancel', () => {
    showing(
      overview({
        subscription: subscription({
          status: SubscriptionStatus.Active,
          trialEndsAt: null,
          currentPeriodEnd: '2026-12-01T00:00:00.000Z',
          cancelAtPeriodEnd: true,
        }),
      }),
    );
    mount();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel subscription' })).toBeNull();
  });

  it('warns once the subscription has lapsed and lets every plan be chosen again', () => {
    showing(
      overview({
        lapsed: true,
        subscription: subscription({ status: SubscriptionStatus.Cancelled }),
      }),
    );
    mount();
    expect(screen.getByText(/Your subscription has ended/)).toBeInTheDocument();
    expect(within(cardOf('Growth')).getByRole('button', { name: 'Choose' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Cancel subscription' })).toBeNull();
  });

  it('cannot choose a free plan', () => {
    showing(overview({ plans: [plan({ id: 'free', name: 'Free', prices: [] })] }));
    mount();
    const card = cardOf('Free');
    expect(within(card).getByRole('button', { name: 'Choose' })).toBeDisabled();
    expect(within(card).getAllByText('Free').length).toBeGreaterThan(1);
  });

  it.each([
    ['?checkout=done', 'Payment received.'],
    ['?checkout=cancelled', 'Checkout cancelled. Nothing was charged.'],
  ])('reports what the gateway sent the administrator back with (%s)', (query, text) => {
    mount(`/admin/billing${query}`);
    expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
  });

  it('opens the checkout for a chosen plan and closes it again', async () => {
    showing(overview({ providers: [CheckoutProvider.Stripe] }));
    const user = mount();
    await user.click(within(cardOf('Scale')).getByRole('button', { name: 'Choose' }));

    const heading = await screen.findByRole('heading', { name: 'Subscribe to Scale', level: 2 });
    const drawer = heading.closest('.MuiDrawer-paper') as HTMLElement;
    expect(within(drawer).getByRole('combobox', { name: /Pay with/ })).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Subscribe to Scale' })).toBeNull(),
    );
  });

  it('closes the checkout from its close button', async () => {
    showing(overview({ providers: [CheckoutProvider.Stripe] }));
    const user = mount();
    await user.click(within(cardOf('Scale')).getByRole('button', { name: 'Choose' }));
    const heading = await screen.findByRole('heading', { name: 'Subscribe to Scale', level: 2 });

    await user.click(
      within(heading.closest('.MuiDrawer-paper') as HTMLElement).getByRole('button', {
        name: 'Close',
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Subscribe to Scale' })).toBeNull(),
    );
  });

  it('cancels after confirming, and reloads', async () => {
    hooks.cancel.mockResolvedValue({});
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel subscription' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel subscription' }));

    expect(await screen.findByText('Subscription cancelled')).toBeInTheDocument();
    expect(hooks.cancel).toHaveBeenCalledTimes(1);
    expect(hooks.refetch).toHaveBeenCalled();
  });

  it('does nothing when the cancel is not confirmed', async () => {
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel subscription' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(hooks.cancel).not.toHaveBeenCalled();
  });

  it('says why a cancel was refused', async () => {
    hooks.cancel.mockRejectedValue(new Error('There is no subscription to cancel.'));
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel subscription' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Cancel subscription',
      }),
    );

    expect(await screen.findByText('There is no subscription to cancel.')).toBeInTheDocument();
    expect(hooks.refetch).not.toHaveBeenCalled();
  });

  it('holds the cancel button while a cancel is running', () => {
    hooks.cancelling = true;
    mount();
    expect(screen.getByRole('button', { name: 'Cancel subscription' })).toBeDisabled();
  });
});

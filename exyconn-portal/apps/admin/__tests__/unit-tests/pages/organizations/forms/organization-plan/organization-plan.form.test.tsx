import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionStatus } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { OrganizationPlanDialog } from '../../../../../../src/pages/organizations/OrganizationPlanDialog';
import { organization } from '../../organizations.fixtures';
import { plan, subscription } from '../../../billing/billing.fixtures';

const hooks = vi.hoisted(() => ({
  plans: { data: undefined as unknown, loading: false },
  current: { data: undefined as unknown, loading: false },
  currentQuery: vi.fn(),
  assign: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useBillingPlansQuery: () => hooks.plans,
  useOrganizationSubscriptionQuery: (options: unknown) => {
    hooks.currentQuery(options);
    return hooks.current;
  },
  useAssignOrganizationPlanMutation: () => [hooks.assign],
}));

const SCALE = plan({ id: 'plan-scale', name: 'Scale' });

beforeEach(() => {
  hooks.plans = { data: { billingPlans: [plan(), SCALE] }, loading: false };
  hooks.current = { data: { organizationSubscription: subscription() }, loading: false };
});
afterEach(() => vi.resetAllMocks());

function mount(open = true) {
  const onClose = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <OrganizationPlanDialog organization={open ? organization() : null} onClose={onClose} />,
  );
  return { user, onClose };
}

const select = (name: RegExp) => screen.getByRole('combobox', { name });

describe('OrganizationPlanDialog', () => {
  it('stays closed while no company is picked', () => {
    mount(false);
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('waits for the plans and the company’s subscription', () => {
    hooks.current = { data: undefined, loading: true };
    mount();
    expect(screen.getByRole('heading', { name: 'Plan for Acme', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('starts on the company’s current plan and status, read fresh', () => {
    mount();
    expect(screen.getByRole('heading', { name: 'Plan for Acme', level: 2 })).toBeInTheDocument();
    expect(select(/^Plan/)).toHaveTextContent('Growth');
    expect(select(/^Status/)).toHaveTextContent('Free trial');
    expect(hooks.currentQuery).toHaveBeenCalledWith({
      variables: { organizationId: 'org-1' },
      fetchPolicy: 'network-only',
    });
  });

  it('moves a company already on a plan to another plan and status, then closes', async () => {
    hooks.assign.mockResolvedValue({});
    const { user, onClose } = mount();
    await user.click(select(/^Plan/));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Scale' }));
    await user.click(select(/^Status/));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Active' }));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Plan for Acme updated')).toBeInTheDocument();
    expect(hooks.assign).toHaveBeenCalledWith({
      variables: {
        organizationId: 'org-1',
        planId: 'plan-scale',
        status: SubscriptionStatus.Active,
      },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('needs a plan for a company that is on none, defaulting it to Active', async () => {
    hooks.current = { data: { organizationSubscription: null }, loading: false };
    hooks.plans = { data: undefined, loading: false };
    const { user } = mount();
    expect(select(/^Status/)).toHaveTextContent('Active');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Pick a plan')).toBeInTheDocument();
    expect(hooks.assign).not.toHaveBeenCalled();
  });

  it('places a company on no plan on one', async () => {
    hooks.current = { data: { organizationSubscription: null }, loading: false };
    hooks.assign.mockResolvedValue({});
    const { user } = mount();
    await user.click(select(/^Plan/));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Scale' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Plan for Acme created')).toBeInTheDocument();
    expect(hooks.assign).toHaveBeenCalledWith({
      variables: {
        organizationId: 'org-1',
        planId: 'plan-scale',
        status: SubscriptionStatus.Active,
      },
    });
  });

  it('says why the change was refused and stays open', async () => {
    hooks.assign.mockRejectedValue(new Error('Plan not found'));
    const { user, onClose } = mount();
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Plan not found')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Cancel', async () => {
    const { user, onClose } = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

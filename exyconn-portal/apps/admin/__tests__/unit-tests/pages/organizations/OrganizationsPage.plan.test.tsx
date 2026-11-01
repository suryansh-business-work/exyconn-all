import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { OrganizationsPage } from '../../../../src/pages/organizations';
import { organization } from './organizations.fixtures';
import { plan } from '../billing/billing.fixtures';

const hooks = vi.hoisted(() => ({ refetch: vi.fn(), assign: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useOrganizationsQuery: () => ({
    data: { organizations: [organization()] },
    loading: false,
    refetch: hooks.refetch,
  }),
  useSetOrganizationStatusMutation: () => [vi.fn()],
  useOrganizationHistoryQuery: () => ({ data: { organizationHistory: [] }, loading: false }),
  useBillingPlansQuery: () => ({ data: { billingPlans: [plan()] }, loading: false }),
  useOrganizationSubscriptionQuery: () => ({
    data: { organizationSubscription: null },
    loading: false,
  }),
  useAssignOrganizationPlanMutation: () => [hooks.assign],
}));

beforeEach(() => {
  hooks.refetch.mockResolvedValue({});
  hooks.assign.mockResolvedValue({});
});
afterEach(() => vi.resetAllMocks());

describe('OrganizationsPage › Plan', () => {
  it('opens the plan dialog for a company, saves and reloads the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationsPage />);
    const row = screen.getByText('Acme').closest('tr') as HTMLElement;

    await user.click(within(row).getByRole('button', { name: 'Plan' }));
    const dialog = (
      await screen.findByRole('heading', { name: 'Plan for Acme', level: 2 })
    ).closest('.MuiDrawer-paper') as HTMLElement;
    await user.click(within(dialog).getByRole('combobox', { name: /^Plan/ }));
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Growth' }));
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Plan for Acme', level: 2 })).toBeNull(),
    );
    expect(hooks.assign).toHaveBeenCalledWith({
      variables: { organizationId: 'org-1', planId: 'plan-growth', status: 'ACTIVE' },
    });
    expect(hooks.refetch).toHaveBeenCalled();
  });
});

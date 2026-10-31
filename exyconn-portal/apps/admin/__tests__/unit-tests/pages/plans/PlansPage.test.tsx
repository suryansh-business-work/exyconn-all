import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { PlansPage } from '../../../../src/pages/plans';
import { plan } from '../billing/billing.fixtures';

const hooks = vi.hoisted(() => ({
  list: { data: undefined as unknown, loading: false },
  refetch: vi.fn(),
  remove: vi.fn(),
  /** Stands in for the confirm dialog when a test needs it to fail. */
  confirm: null as null | (() => Promise<boolean>),
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>();
  return { ...actual, useConfirm: () => hooks.confirm ?? actual.useConfirm() };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useBillingPlansQuery: () => ({ ...hooks.list, refetch: hooks.refetch }),
  useDeleteBillingPlanMutation: () => [hooks.remove],
  useCreateBillingPlanMutation: () => [vi.fn()],
  useUpdateBillingPlanMutation: () => [vi.fn()],
}));

const GROWTH = plan();
const FREE = plan({ id: 'plan-free', key: 'free', name: 'Free', prices: [], isPublic: false });
const OLD = plan({ id: 'plan-old', key: 'old', name: 'Legacy', isActive: false });
const SYSTEM = plan({
  id: 'plan-sys',
  key: 'grandfathered',
  name: 'Grandfathered',
  isSystem: true,
  allModules: true,
  seatLimit: 0,
});

beforeEach(() => {
  hooks.confirm = null;
  hooks.list = { data: { billingPlans: [GROWTH, FREE, OLD, SYSTEM] }, loading: false };
  hooks.refetch.mockResolvedValue({});
});
afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

function mount() {
  const user = userEvent.setup();
  renderWithProviders(<PlansPage />);
  return user;
}

const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement;

async function confirmDelete(user: ReturnType<typeof userEvent.setup>, name: string, ok = true) {
  await user.click(within(rowOf(name)).getByRole('button', { name: 'Delete' }));
  const dialog = await screen.findByRole('dialog');
  expect(
    within(dialog).getByText(`Delete ${name}? Only a plan nobody is on can be deleted.`),
  ).toBeInTheDocument();
  await user.click(within(dialog).getByRole('button', { name: ok ? 'Delete' : 'Cancel' }));
}

describe('PlansPage', () => {
  it('says how to start when there is no plan', () => {
    hooks.list = { data: undefined, loading: false };
    mount();
    expect(screen.getByText('No plans yet. Create one to open self sign-up.')).toBeInTheDocument();
  });

  it('lists each plan with its price, seats, modules and state', () => {
    mount();
    const growth = within(rowOf('Growth'));
    expect(growth.getByText(/49/)).toBeInTheDocument();
    expect(growth.getByText('Up to 10 people')).toBeInTheDocument();
    expect(growth.getByText('CRM, HR')).toBeInTheDocument();
    expect(growth.getByText('Public')).toBeInTheDocument();
    expect(within(rowOf('free')).getAllByText('Free')).toHaveLength(2);
    expect(within(rowOf('free')).getByText('Private')).toBeInTheDocument();
    expect(within(rowOf('Legacy')).getByText('Retired')).toBeInTheDocument();
    const system = within(rowOf('Grandfathered'));
    expect(system.getByText('System')).toBeInTheDocument();
    expect(system.getByText('Unlimited people')).toBeInTheDocument();
    expect(system.getByText('Every module')).toBeInTheDocument();
    expect(system.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('opens a blank form for a new plan and an editing form for a row, reloading on close', async () => {
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'New plan' }));
    const create = (await screen.findByRole('heading', { name: 'New plan', level: 2 })).closest(
      '.MuiDrawer-paper',
    ) as HTMLElement;
    await user.click(within(create).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'New plan', level: 2 })).toBeNull(),
    );
    expect(hooks.refetch).toHaveBeenCalled();

    await user.click(within(rowOf('Growth')).getByRole('button', { name: 'edit' }));
    expect(
      await screen.findByRole('heading', { name: 'Edit Growth', level: 2 }),
    ).toBeInTheDocument();
  });

  it('logs a failed reload after closing the form', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    hooks.refetch.mockRejectedValue(new Error('offline'));
    const user = mount();
    await user.click(screen.getByRole('button', { name: 'New plan' }));
    const heading = await screen.findByRole('heading', { name: 'New plan', level: 2 });
    await user.click(
      within(heading.closest('.MuiDrawer-paper') as HTMLElement).getByRole('button', {
        name: 'Cancel',
      }),
    );
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith('Could not reload plans', expect.any(Error)),
    );
  });

  it('deletes a plan after confirming and reloads', async () => {
    hooks.remove.mockResolvedValue({});
    const user = mount();
    await confirmDelete(user, 'Legacy');

    expect(await screen.findByText('Plan deleted')).toBeInTheDocument();
    expect(hooks.remove).toHaveBeenCalledWith({ variables: { id: 'plan-old' } });
    expect(hooks.refetch).toHaveBeenCalled();
  });

  it('keeps the plan when the delete is not confirmed', async () => {
    const user = mount();
    await confirmDelete(user, 'Legacy', false);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(hooks.remove).not.toHaveBeenCalled();
  });

  it('says why a plan could not be deleted', async () => {
    hooks.remove.mockRejectedValue(new Error('Companies are on this plan. Retire it instead.'));
    const user = mount();
    await confirmDelete(user, 'Growth');
    expect(
      await screen.findByText('Companies are on this plan. Retire it instead.'),
    ).toBeInTheDocument();
  });

  it('reports a reload that failed after the delete', async () => {
    hooks.remove.mockResolvedValue({});
    hooks.refetch.mockRejectedValue(new Error('offline'));
    const user = mount();
    await confirmDelete(user, 'Legacy');
    expect(await screen.findByText('offline')).toBeInTheDocument();
  });

  it('logs a delete whose confirmation itself failed', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    hooks.confirm = () => Promise.reject(new Error('dialog gone'));
    const user = mount();
    await user.click(within(rowOf('Legacy')).getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith('Could not delete the plan', expect.any(Error)),
    );
    expect(hooks.remove).not.toHaveBeenCalled();
  });
});

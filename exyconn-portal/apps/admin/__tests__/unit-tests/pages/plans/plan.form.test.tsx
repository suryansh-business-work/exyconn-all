import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanInterval, Role } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { PlanForm, type PlanRow } from '../../../../src/pages/plans/forms/plan';
import { plan } from '../billing/billing.fixtures';

const hooks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCreateBillingPlanMutation: () => [hooks.create],
  useUpdateBillingPlanMutation: () => [hooks.update],
}));

afterEach(() => vi.resetAllMocks());

function mount(initial: PlanRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(<PlanForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { user, onDone, onCancel };
}

const field = (name: RegExp) => screen.getByRole('textbox', { name });

describe('PlanForm', () => {
  it('needs a name, a key and its modules before creating a plan', async () => {
    const { user } = mount();
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('A name is required')).toBeInTheDocument();
    expect(screen.getByText('A key is required')).toBeInTheDocument();
    expect(
      screen.getByText('Pick the modules it includes, or include every module'),
    ).toBeInTheDocument();
    expect(hooks.create).not.toHaveBeenCalled();
  });

  it('creates a free plan that opens every module, hiding the module picker', async () => {
    hooks.create.mockResolvedValue({});
    const { user, onDone } = mount();
    await user.type(field(/^Name/), 'Starter');
    await user.type(field(/^Key/), 'starter');
    expect(screen.getByRole('combobox', { name: /Modules/ })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Include every module' }));
    expect(screen.queryByRole('combobox', { name: /Modules/ })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Plan created')).toBeInTheDocument();
    expect(hooks.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          key: 'starter',
          name: 'Starter',
          prices: [],
          allModules: true,
          interval: PlanInterval.Month,
          trialDays: 14,
        }),
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('adds a price row, validates it and removes it again', async () => {
    const { user } = mount();
    await user.click(screen.getByRole('button', { name: 'Add price' }));
    await user.click(screen.getByRole('button', { name: 'Add price' }));
    expect(screen.getAllByRole('spinbutton', { name: /^Amount/ })).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect((await screen.findAllByText('Currency is required')).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Remove price 2' }));
    await user.click(screen.getByRole('button', { name: 'Remove price 1' }));
    expect(screen.queryByRole('spinbutton', { name: /^Amount/ })).toBeNull();
  });

  it('edits a plan with its key locked and saves the change', async () => {
    hooks.update.mockResolvedValue({});
    const { user, onDone } = mount(plan());
    expect(field(/^Key/)).toBeDisabled();
    expect(field(/^Key/)).toHaveValue('growth');
    expect(screen.getAllByRole('spinbutton', { name: /^Amount/ })).toHaveLength(2);

    const name = field(/^Name/);
    await user.clear(name);
    await user.type(name, 'Growth Plus');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Plan updated')).toBeInTheDocument();
    expect(hooks.update).toHaveBeenCalledWith({
      variables: {
        id: 'plan-growth',
        input: expect.objectContaining({
          key: 'growth',
          name: 'Growth Plus',
          modules: [Role.Crm, Role.Hr],
          prices: [
            { currency: 'USD', amount: 49 },
            { currency: 'INR', amount: 3999 },
          ],
        }),
      },
    });
    expect(onDone).toHaveBeenCalled();
  });

  it('offers every company module but never Admin, My Workspace or the platform role', async () => {
    const { user } = mount();
    await user.click(screen.getByRole('combobox', { name: /Modules/ }));
    const list = within(screen.getByRole('listbox'));

    expect(list.getByRole('option', { name: 'CRM' })).toBeInTheDocument();
    expect(list.getByRole('option', { name: 'Finance' })).toBeInTheDocument();
    expect(list.queryByRole('option', { name: 'Admin' })).toBeNull();
    expect(list.queryByRole('option', { name: 'Employee' })).toBeNull();
    expect(list.queryByRole('option', { name: 'Super Admin' })).toBeNull();
  });

  it('says why a save was refused and stays open', async () => {
    hooks.update.mockRejectedValue(new Error('The grandfathered plan cannot be retired.'));
    const { user, onDone } = mount(plan({ isSystem: true }));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('The grandfathered plan cannot be retired.'),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    const { user, onCancel } = mount();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });
});

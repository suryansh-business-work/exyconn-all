import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetForm } from '../../../../../src/pages/budgets/forms/budget';
import { budgetRow } from '../../../fixtures';
import { renderForm } from '../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateBudgetMutation: () => [gql.create],
  useUpdateBudgetMutation: () => [gql.update],
}));

const CENTRES = [
  { value: 'centre-1', label: 'ENG — Engineering' },
  { value: 'centre-2', label: 'MKT — Marketing' },
];

const monthField = () => screen.getByLabelText('Month');

describe('BudgetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createBudget: { id: 'budget-9' } } });
    gql.update.mockResolvedValue({ data: { updateBudget: { id: 'budget-1' } } });
  });

  it('sets a month’s budget for a cost centre in the company currency', async () => {
    const onDone = vi.fn();
    renderForm(
      <BudgetForm initial={null} costCentres={CENTRES} onDone={onDone} onCancel={vi.fn()} />,
      { inRupees: true },
    );

    await userEvent.click(screen.getByRole('combobox', { name: /Cost centre/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'MKT — Marketing' }),
    );
    await userEvent.type(monthField(), '2026-04');
    fireEvent.change(screen.getByLabelText('Budget amount'), { target: { value: '25000' } });
    await userEvent.type(screen.getByLabelText('Note'), ' Launch ');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          costCenterId: 'centre-2',
          month: '2026-04',
          amount: 25000,
          currency: 'INR',
          note: 'Launch',
        },
      },
    });
    expect(await screen.findByText('Budget created')).toBeInTheDocument();
  });

  it('requires a cost centre, a YYYY-MM month and a currency', async () => {
    renderForm(
      <BudgetForm initial={null} costCentres={CENTRES} onDone={vi.fn()} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Pick a cost centre')).toBeInTheDocument();
    expect(screen.getByText('Use YYYY-MM, e.g. 2026-04')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a month the actuals could never be compared to', async () => {
    renderForm(
      <BudgetForm
        initial={budgetRow()}
        costCentres={CENTRES}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.clear(monthField());
    await userEvent.type(monthField(), '2026-13');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Use YYYY-MM, e.g. 2026-04')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('refuses a negative budget', async () => {
    renderForm(
      <BudgetForm
        initial={budgetRow()}
        costCentres={CENTRES}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Budget amount'), { target: { value: '-1' } });
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Must be ≥ 0')).toBeInTheDocument();
  });

  it('updates a budget with its own figures', async () => {
    const onDone = vi.fn();
    renderForm(
      <BudgetForm initial={budgetRow()} costCentres={CENTRES} onDone={onDone} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'budget-1',
        input: {
          costCenterId: 'centre-1',
          month: '2026-09',
          amount: 100000,
          currency: 'INR',
          note: 'Hiring',
        },
      },
    });
  });

  it('says why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('A budget for 2026-09 already exists'));
    renderForm(
      <BudgetForm
        initial={budgetRow()}
        costCentres={CENTRES}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('A budget for 2026-09 already exists')).toBeInTheDocument();
  });
});

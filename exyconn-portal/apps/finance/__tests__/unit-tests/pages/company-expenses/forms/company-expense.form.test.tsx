import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseCategory } from '@exyconn/shell/graphql/generated';
import { CompanyExpenseForm } from '../../../../../src/pages/company-expenses/forms/company-expense';
import { companyExpenseRow, costCenterRow } from '../../../fixtures';
import { localIso, renderForm, typeDate } from '../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), centres: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCompanyExpenseMutation: () => [gql.create],
  useUpdateCompanyExpenseMutation: () => [gql.update],
  useListCostCentersQuery: () => gql.centres(),
}));

const CENTRES = [
  costCenterRow({ id: 'centre-1', code: 'ENG', name: 'Engineering' }),
  costCenterRow({ id: 'centre-2', code: 'OLD', name: 'Retired team', isActive: false }),
];

async function pick(field: RegExp, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: field }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: option }));
}

describe('CompanyExpenseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.centres.mockReturnValue({ data: { listCostCenters: CENTRES } });
    gql.create.mockResolvedValue({ data: { createCompanyExpense: { id: 'expense-9' } } });
    gql.update.mockResolvedValue({ data: { updateCompanyExpense: { id: 'expense-1' } } });
  });

  it('offers unallocated and the active cost centres only', async () => {
    renderForm(<CompanyExpenseForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('combobox', { name: /Cost centre/ }));

    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Unallocated', 'ENG — Engineering']);
  });

  it('requires the vendor, currency and both dates', async () => {
    renderForm(<CompanyExpenseForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Vendor is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(screen.getByText('Incurred date is required')).toBeInTheDocument();
    expect(screen.getByText('Due date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('records a bill against a cost centre', async () => {
    const onDone = vi.fn();
    renderForm(<CompanyExpenseForm initial={null} onDone={onDone} onCancel={vi.fn()} />, {
      inRupees: true,
    });

    await userEvent.type(screen.getByLabelText('Vendor'), 'Figma');
    await pick(/Category/, 'Software');
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '450' } });
    await pick(/Cost centre/, 'ENG — Engineering');
    typeDate('incurredOn', '09/01/2026');
    typeDate('dueDate', '09/30/2026');
    await userEvent.type(screen.getByLabelText('Reference'), 'INV-F-1');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          vendor: 'Figma',
          category: ExpenseCategory.Software,
          description: '',
          amount: 450,
          currency: 'INR',
          costCenterId: 'centre-1',
          incurredOn: localIso(2026, 8, 1),
          dueDate: localIso(2026, 8, 30),
          reference: 'INV-F-1',
        },
      },
    });
    expect(await screen.findByText('Expense created')).toBeInTheDocument();
  });

  it('updates a bill with its own figures, unallocated when it has no centre', async () => {
    const onDone = vi.fn();
    renderForm(
      <CompanyExpenseForm initial={companyExpenseRow()} onDone={onDone} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'expense-1',
        input: {
          vendor: 'AWS',
          category: ExpenseCategory.Software,
          description: 'Hosting',
          amount: 8000,
          currency: 'INR',
          costCenterId: '',
          incurredOn: '2026-09-01',
          dueDate: '2026-09-15',
          reference: 'BILL-9',
        },
      },
    });
  });

  it('refuses a due date before the cost was incurred', async () => {
    const row = companyExpenseRow({ incurredOn: '2026-09-10', dueDate: '2026-09-01' });
    renderForm(<CompanyExpenseForm initial={row} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('Due date cannot be before the date the cost was incurred'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('says why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Bill is settled'));
    renderForm(
      <CompanyExpenseForm initial={companyExpenseRow()} onDone={vi.fn()} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Bill is settled')).toBeInTheDocument();
  });

  it('still offers unallocated before the centres load', async () => {
    gql.centres.mockReturnValue({ data: undefined });
    renderForm(<CompanyExpenseForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('combobox', { name: /Cost centre/ }));

    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1);
  });
});

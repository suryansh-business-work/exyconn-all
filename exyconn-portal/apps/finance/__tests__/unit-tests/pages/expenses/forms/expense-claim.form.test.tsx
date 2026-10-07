import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseStatus } from '@exyconn/shell/graphql/generated';
import { ExpenseClaimForm } from '../../../../../src/pages/expenses/forms/expense-claim';
import { claimRow } from '../../../fixtures';
import { field, localIso, renderForm, typeDate } from '../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), employees: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateExpenseClaimMutation: () => [gql.create],
  useUpdateExpenseClaimMutation: () => [gql.update],
  useListEmployeeOptionsQuery: () => gql.employees(),
}));

const EMPLOYEES = [{ id: 'employee-7', name: 'Asha Rao', email: 'asha@example.com' }];

describe('ExpenseClaimForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.employees.mockReturnValue({ data: { listEmployeeOptions: EMPLOYEES } });
    gql.create.mockResolvedValue({ data: { createExpenseClaim: { id: 'claim-9' } } });
    gql.update.mockResolvedValue({ data: { updateExpenseClaim: { id: 'claim-1' } } });
  });

  it('requires the employee, category, description, currency and date', async () => {
    renderForm(<ExpenseClaimForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Employee is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(screen.getByText('Incurred on is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('files a claim for an employee, with no receipt and no approved amount yet', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    renderForm(<ExpenseClaimForm initial={null} onDone={onDone} onCancel={vi.fn()} />, {
      inRupees: true,
    });

    await user.type(screen.getByRole('combobox', { name: 'Employee' }), 'Asha');
    await user.click(await screen.findByRole('option', { name: 'Asha Rao (asha@example.com)' }));
    await user.type(screen.getByLabelText('Category'), 'Travel');
    await user.type(screen.getByLabelText('Description'), 'Airport cab');
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '640');
    typeDate('incurredOn', '09/03/2026');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          employeeId: 'employee-7',
          category: 'Travel',
          description: 'Airport cab',
          amount: 640,
          currency: 'INR',
          incurredOn: localIso(2026, 8, 3),
          receiptUrl: null,
          status: ExpenseStatus.Approved,
          approvedAmount: null,
        },
      },
    });
    expect(await screen.findByText('ExpenseClaim created')).toBeInTheDocument();
  });

  it('updates a claim, keeping its receipt link and approved amount', async () => {
    const onDone = vi.fn();
    const row = claimRow({
      receiptUrl: 'https://files.example.com/receipt.pdf',
      approvedAmount: 900,
      status: ExpenseStatus.Approved,
    });
    renderForm(<ExpenseClaimForm initial={row} onDone={onDone} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'claim-1',
        input: {
          employeeId: 'employee-1',
          category: 'Travel',
          description: 'Client visit cab',
          amount: 1200,
          currency: 'INR',
          incurredOn: '2026-09-01',
          receiptUrl: 'https://files.example.com/receipt.pdf',
          status: ExpenseStatus.Approved,
          approvedAmount: 900,
        },
      },
    });
  });

  it('saves an unset receipt and approved amount as null', async () => {
    renderForm(<ExpenseClaimForm initial={claimRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input).toMatchObject({
      receiptUrl: null,
      approvedAmount: null,
      status: ExpenseStatus.Submitted,
    });
  });

  it('asks for a full link to the receipt', async () => {
    renderForm(<ExpenseClaimForm initial={claimRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.type(field('receiptUrl'), 'files.example.com/receipt');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Enter a full URL starting with https://')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('says why a save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Claim is locked'));
    renderForm(<ExpenseClaimForm initial={claimRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Claim is locked')).toBeInTheDocument();
  });

  it('opens with an empty employee picker before the people load', () => {
    gql.employees.mockReturnValue({ data: undefined });
    renderForm(<ExpenseClaimForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Employee' })).toHaveValue('');
  });
});

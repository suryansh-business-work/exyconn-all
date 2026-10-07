import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseStatus, ListExpenseClaimsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ExpensesPage } from '../../../../src/pages/expenses';
import { EXPENSE_CLAIM_COLUMNS } from '../../../../src/pages/expenses/expense-claim-grid';
import { renderWithProviders } from '../../test-utils';
import { claimRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import {
  answerRowAction,
  confirmRowDelete,
  runRowAction,
  statLines,
} from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  deleteClaim: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListExpenseClaimsStatsQuery: () => gql.stats(),
  useDeleteExpenseClaimMutation: () => [gql.deleteClaim],
  useSetExpenseClaimStatusMutation: () => [gql.setStatus],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/expenses/forms/expense-claim', async () => ({
  ExpenseClaimForm: (await import('../../form-stub')).FormStub,
}));

vi.mock('../../../../src/pages/expenses/forms/approve-claim', async () => ({
  ApproveClaimForm: (await import('../../form-stub')).FormStub,
}));

describe('ExpensesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteClaim.mockResolvedValue({ data: { deleteExpenseClaim: true } });
    gql.setStatus.mockResolvedValue({ data: { setExpenseClaimStatus: { id: 'claim-1' } } });
    gql.stats.mockReturnValue({
      data: {
        listExpenseClaimsStats: tableStats(9, { status: { SUBMITTED: 4, APPROVED: 3, PAID: 2 } }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the claims by where they are in the approval flow', () => {
    renderWithProviders(<ExpensesPage />);

    expect(statLines()).toEqual(['Claims: 9', 'Submitted: 4', 'Approved: 3', 'Paid: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<ExpensesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('drives the server grid with the paged claims query and the claim columns', () => {
    renderWithProviders(<ExpensesPage />);
    const page = { totalCount: 1, rows: [claimRow()] };

    expect(paged.document).toBe(ListExpenseClaimsPagedDocument);
    expect(paged.select?.({ listExpenseClaimsPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Expense Claims',
      exportFileName: 'expense-claims',
      permissionModule: 'ExpenseClaim',
      columnDefs: EXPENSE_CLAIM_COLUMNS,
    });
  });

  it('opens the approval panel for a claim, and reloads once it is approved', async () => {
    renderWithProviders(<ExpensesPage />);

    await runRowAction('approve', claimRow({ description: 'Hotel stay' }));
    expect(screen.getByRole('heading', { name: 'Approve claim' })).toBeInTheDocument();
    expect(screen.getByText(/"description":"Hotel stay"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Hotel stay/)).not.toBeInTheDocument();
  });

  it('closes the approval panel on cancel without reloading', async () => {
    renderWithProviders(<ExpensesPage />);

    await runRowAction('approve', claimRow({ description: 'Taxi' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    expect(screen.queryByText(/Taxi/)).not.toBeInTheDocument();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('rejects a claim after confirming', async () => {
    renderWithProviders(<ExpensesPage />);

    await answerRowAction(
      'reject',
      claimRow({ id: 'claim-3' }),
      'Reject the Travel claim for 1200?',
      'Reject',
    );

    expect(gql.setStatus).toHaveBeenCalledWith({
      variables: { id: 'claim-3', status: ExpenseStatus.Rejected },
    });
    expect(await screen.findByText('Claim rejected')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('marks a claim paid for the amount approved, falling back to the amount claimed', async () => {
    renderWithProviders(<ExpensesPage />);

    await answerRowAction(
      'pay',
      claimRow({ id: 'claim-4', approvedAmount: 900 }),
      'Record the Travel claim as reimbursed today for 900?',
      'Mark paid',
    );
    expect(gql.setStatus).toHaveBeenCalledWith({
      variables: { id: 'claim-4', status: ExpenseStatus.Paid },
    });
    expect(await screen.findByText('Claim marked as paid')).toBeInTheDocument();

    await answerRowAction(
      'pay',
      claimRow({ approvedAmount: null }),
      'Record the Travel claim as reimbursed today for 1200?',
      'Cancel',
    );
    expect(gql.setStatus).toHaveBeenCalledTimes(1);
  });

  it('says why a decision could not be recorded, or that it could not', async () => {
    gql.setStatus.mockRejectedValueOnce(new Error('Claim already paid'));
    renderWithProviders(<ExpensesPage />);

    await answerRowAction('reject', claimRow(), 'Reject the Travel claim for 1200?', 'Reject');
    expect(await screen.findByText('Claim already paid')).toBeInTheDocument();

    gql.setStatus.mockRejectedValueOnce('offline');
    await answerRowAction('reject', claimRow(), 'Reject the Travel claim for 1200?', 'Reject');
    expect(await screen.findByText('Could not update the claim')).toBeInTheDocument();
  });

  it('opens the claim form blank or with the row, and deletes a claim after confirming', async () => {
    renderWithProviders(<ExpensesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await runRowAction('edit', claimRow({ category: 'Meals' }));
    expect(screen.getByText(/"category":"Meals"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    await confirmRowDelete(claimRow({ id: 'claim-8' }), 'Delete this claim?');
    expect(gql.deleteClaim).toHaveBeenCalledWith({ variables: { id: 'claim-8' } });
    expect(await screen.findByText('ExpenseClaim deleted')).toBeInTheDocument();
  });
});

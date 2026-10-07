import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListCompanyExpensesPagedDocument } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { CompanyExpensesPage } from '../../../../src/pages/company-expenses';
import { renderWithProviders } from '../../test-utils';
import { companyExpenseRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import {
  answerRowAction,
  confirmRowDelete,
  runRowAction,
  statLines,
} from '../../crud-page-helpers';
import { columnIds } from '../../grid-helpers';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  deleteExpense: vi.fn(),
  markPaid: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCompanyExpensesStatsQuery: () => gql.stats(),
  useDeleteCompanyExpenseMutation: () => [gql.deleteExpense],
  useMarkExpensePaidMutation: () => [gql.markPaid],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/company-expenses/forms/company-expense', async () => ({
  CompanyExpenseForm: (await import('../../form-stub')).FormStub,
}));

const SETTLE_PROMPT = 'Record the AWS bill as paid today?';

describe('CompanyExpensesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteExpense.mockResolvedValue({ data: { deleteCompanyExpense: true } });
    gql.markPaid.mockResolvedValue({ data: { markExpensePaid: { id: 'expense-1' } } });
    gql.stats.mockReturnValue({
      data: {
        listCompanyExpensesStats: tableStats(
          6,
          { status: { UNPAID: 4, PAID: 2 } },
          { amount: 750 },
        ),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the bills, what they add up to, and how many are paid', () => {
    renderWithProviders(<CompanyExpensesPage />);

    expect(statLines()).toEqual([
      'Bills: 6',
      `Recorded: ${formatMoney(750)}`,
      'Unpaid: 4',
      'Paid: 2',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<CompanyExpensesPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[1]).toBe(`Recorded: ${formatMoney(0)}`);
  });

  it('drives the server grid with the paged bills query and the bill columns', () => {
    renderWithProviders(<CompanyExpensesPage />);
    const page = { totalCount: 1, rows: [companyExpenseRow()] };

    expect(paged.document).toBe(ListCompanyExpensesPagedDocument);
    expect(paged.select?.({ listCompanyExpensesPaged: page } as never)).toBe(page);
    expect(columnIds(dashboardProps().columnDefs)).toContain('dueDate');
    expect(dashboardProps()).toMatchObject({
      title: 'Company expenses',
      exportFileName: 'company-expenses',
      permissionModule: 'CompanyExpense',
    });
  });

  it('settles a bill today after confirming, then reloads', async () => {
    renderWithProviders(<CompanyExpensesPage />);

    await answerRowAction(
      'settle',
      companyExpenseRow({ id: 'expense-3' }),
      SETTLE_PROMPT,
      'Mark paid',
    );

    expect(gql.markPaid).toHaveBeenCalledWith({ variables: { id: 'expense-3' } });
    expect(await screen.findByText('Bill settled')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(2);
  });

  it('leaves a bill alone when the confirmation is cancelled', async () => {
    renderWithProviders(<CompanyExpensesPage />);

    await answerRowAction('settle', companyExpenseRow(), SETTLE_PROMPT, 'Cancel');

    expect(gql.markPaid).not.toHaveBeenCalled();
  });

  it('says why a bill could not be settled, or that it could not', async () => {
    gql.markPaid.mockRejectedValueOnce(new Error('Bill is already paid'));
    renderWithProviders(<CompanyExpensesPage />);

    await answerRowAction('settle', companyExpenseRow(), SETTLE_PROMPT, 'Mark paid');
    expect(await screen.findByText('Bill is already paid')).toBeInTheDocument();

    gql.markPaid.mockRejectedValueOnce('offline');
    await answerRowAction('settle', companyExpenseRow(), SETTLE_PROMPT, 'Mark paid');
    expect(await screen.findByText('Could not settle the bill')).toBeInTheDocument();
  });

  it('opens the form blank or with the row, and deletes a bill after confirming', async () => {
    renderWithProviders(<CompanyExpensesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await runRowAction('edit', companyExpenseRow({ vendor: 'Stripe' }));
    expect(screen.getByText(/"vendor":"Stripe"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Stripe/)).not.toBeInTheDocument();

    await confirmRowDelete(companyExpenseRow({ id: 'expense-8' }), 'Delete the AWS bill?');
    expect(gql.deleteExpense).toHaveBeenCalledWith({ variables: { id: 'expense-8' } });
    expect(await screen.findByText('Expense deleted')).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyExpenseClaimsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { money } from './helpers/money';
import { ExpensesPage } from '../../../../src/pages/employee/ExpensesPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyExpenseClaimsQuery: vi.fn(),
}));
vi.mock('../../../../src/pages/employee/forms/expense-claim', async () => {
  const { FormStub } = await import('./helpers/stubs');
  return { ExpenseClaimForm: FormStub };
});

const claim = {
  category: 'Travel',
  currency: 'INR',
  incurredOn: '2026-03-02',
  status: 'PENDING',
};

const claims = [
  {
    ...claim,
    id: 'c1',
    description: 'Cab to client',
    amount: 1200,
    approvedAmount: null,
    receiptUrl: 'https://files.example.com/cab.jpg',
  },
  { ...claim, id: 'c2', description: 'Team lunch', amount: 2500, receiptUrl: null },
  {
    ...claim,
    id: 'c3',
    description: 'Hotel',
    amount: 900,
    approvedAmount: 800,
    status: 'APPROVED',
    receiptUrl: null,
  },
];

describe('ExpensesPage', () => {
  it('lists claims with the claimed and approved amounts, and the receipt when there is one', () => {
    vi.mocked(useMyExpenseClaimsQuery).mockReturnValue(
      queryResult({ data: { myExpenseClaims: claims } }),
    );
    renderWithProviders(<ExpensesPage />);

    const [, cab, lunch, hotel] = screen.getAllByRole('row');
    expect(within(cab).getByText('Cab to client')).toBeInTheDocument();
    expect(within(cab).getByText(money(1200, 'INR'))).toBeInTheDocument();
    expect(within(cab).getByText('on 2026-03-02')).toBeInTheDocument();
    expect(within(cab).getByText('PENDING')).toBeInTheDocument();
    expect(within(cab).getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      'https://files.example.com/cab.jpg',
    );
    // Not yet approved: a dash, not "0".
    expect(within(cab).getAllByText('—')).toHaveLength(1);

    expect(within(lunch).getAllByText('—')).toHaveLength(2);
    expect(within(lunch).queryByRole('link')).toBeNull();

    expect(within(hotel).getByText(money(900, 'INR'))).toBeInTheDocument();
    expect(within(hotel).getByText(money(800, 'INR'))).toBeInTheDocument();
    expect(within(hotel).getByText('APPROVED')).toBeInTheDocument();
  });

  it('says so when no claim has been filed', () => {
    vi.mocked(useMyExpenseClaimsQuery).mockReturnValue(
      queryResult({ data: { myExpenseClaims: [] } }),
    );
    renderWithProviders(<ExpensesPage />);
    expect(screen.getByText('You have not filed any claims yet.')).toBeInTheDocument();
  });

  it('opens the claim form full-page, and comes back by the back link or Cancel', async () => {
    const user = userEvent.setup();
    vi.mocked(useMyExpenseClaimsQuery).mockReturnValue(
      queryResult({ data: { myExpenseClaims: [] } }),
    );
    renderWithProviders(<ExpensesPage />);

    await user.click(screen.getByRole('button', { name: 'New claim' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'New expense claim' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('You have not filed any claims yet.')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Back to Expenses' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New claim' }));
    await user.click(screen.getByRole('button', { name: 'Stub cancel' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
  });

  it('returns to the list and reloads it once a claim is filed', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn(() => Promise.resolve({}));
    vi.mocked(useMyExpenseClaimsQuery).mockReturnValue(
      queryResult({ data: { myExpenseClaims: [] }, refetch }),
    );
    renderWithProviders(<ExpensesPage />);

    await user.click(screen.getByRole('button', { name: 'New claim' }));
    await user.click(screen.getByRole('button', { name: 'Stub done' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('holds the table busy and does not claim the list is empty while the first response loads', () => {
    vi.mocked(useMyExpenseClaimsQuery).mockReturnValue(queryResult({ loading: true }));
    const { container } = renderWithProviders(<ExpensesPage />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('You have not filed any claims yet.')).toBeNull();
  });
});

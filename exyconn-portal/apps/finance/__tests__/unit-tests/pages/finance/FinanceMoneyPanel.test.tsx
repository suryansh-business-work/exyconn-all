import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { formatMoney } from '@exyconn/shell/utils/money';
import { FinanceMoneyPanel } from '../../../../src/pages/finance/FinanceMoneyPanel';
import { renderWithProviders } from '../../test-utils';

describe('FinanceMoneyPanel', () => {
  it('states the panel, the basis its figures follow, and each line with its amount', () => {
    renderWithProviders(
      <FinanceMoneyPanel
        title="Cash movement"
        basis="Cash — dated when the money actually arrived or left."
        lines={[
          { id: 'collected', label: 'Collected', amount: 5000 },
          { id: 'paid', label: 'Bills settled', amount: -2000 },
          { id: 'net', label: 'Net', amount: 3000, total: true },
        ]}
      />,
    );

    expect(screen.getByText('Cash movement')).toBeInTheDocument();
    expect(
      screen.getByText('Cash — dated when the money actually arrived or left.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Collected')).toBeInTheDocument();
    expect(screen.getByText(formatMoney(5000))).toBeInTheDocument();
    expect(screen.getByText(formatMoney(-2000))).toBeInTheDocument();
    expect(screen.getByText(formatMoney(3000))).toBeInTheDocument();
  });

  it('shows a loss as the bottom line, after the lines that add up to it', () => {
    renderWithProviders(
      <FinanceMoneyPanel
        title="Earned and spent"
        basis="Accrual"
        lines={[
          { id: 'expenses', label: 'Expenses', amount: -700 },
          { id: 'profit', label: 'Profit', amount: -400, total: true },
        ]}
      />,
    );

    const expense = screen.getByText(formatMoney(-700));
    const loss = screen.getByText(formatMoney(-400));
    expect(screen.getByText('Profit')).toBeInTheDocument();
    expect(expense.compareDocumentPosition(loss) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders no lines for an empty panel', () => {
    renderWithProviders(<FinanceMoneyPanel title="Position today" basis="As of now" lines={[]} />);

    expect(screen.getByText('Position today')).toBeInTheDocument();
    expect(screen.queryByText(formatMoney(0))).not.toBeInTheDocument();
  });
});

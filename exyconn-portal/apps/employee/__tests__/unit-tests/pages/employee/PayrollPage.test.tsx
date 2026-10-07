import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { useMyPayrollQuery } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { PayrollPage } from '../../../../src/pages/employee/PayrollPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyPayrollQuery: vi.fn(),
}));

const payroll = {
  effectiveFrom: '2026-04-01',
  currency: 'INR',
  basic: 50000,
  hra: 20000,
  allowances: 10000,
  deductions: 5000,
  gross: 80000,
  net: 75000,
};

/** The amount written beside a breakdown label. */
const amountFor = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('PayrollPage', () => {
  it('says it is loading before the structure arrives', () => {
    vi.mocked(useMyPayrollQuery).mockReturnValue(queryResult({ loading: true }));
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('says no structure is on file when HR has not set one', () => {
    vi.mocked(useMyPayrollQuery).mockReturnValue(queryResult({ data: { myPayroll: null } }));
    renderWithProviders(<PayrollPage />);
    expect(screen.getByText('No salary structure on file yet.')).toBeInTheDocument();
  });

  it('breaks the monthly salary down to net pay, deductions marked as taken off', () => {
    vi.mocked(useMyPayrollQuery).mockReturnValue(queryResult({ data: { myPayroll: payroll } }));
    renderWithProviders(<PayrollPage />);

    expect(screen.getByRole('heading', { name: 'Monthly salary' })).toBeInTheDocument();
    expect(screen.getByText('Effective on 2026-04-01')).toBeInTheDocument();
    expect(amountFor('Basic')).toBe(formatMoney(50000, 'INR'));
    expect(amountFor('HRA')).toBe(formatMoney(20000, 'INR'));
    expect(amountFor('Allowances')).toBe(formatMoney(10000, 'INR'));
    expect(amountFor('Deductions')).toBe(`- ${formatMoney(5000, 'INR')}`);
    expect(amountFor('Gross')).toBe(formatMoney(80000, 'INR'));
    expect(screen.getByRole('heading', { name: 'Net pay' }).nextElementSibling).toHaveTextContent(
      formatMoney(75000, 'INR').replaceAll(/\s+/g, ' '),
    );
  });
});

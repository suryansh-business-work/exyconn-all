import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatMoney } from '@exyconn/shell/utils/money';
import { PayrollPage } from '../../../../src/pages/payroll';
import { renderWithProviders } from '../../test-utils';
import { SUMMARY, freezeOctober2026 } from './payroll-page-stubs';

const gql = vi.hoisted(() => ({ summary: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePayrollSummaryQuery: (options: unknown) => gql.summary(options),
  useMarkPayrollPaidMutation: () => [vi.fn(), { loading: false }],
  useSendSalarySlipsMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('../../../../src/pages/payroll/run-dialog', async () => ({
  PayrollRunControl: (await import('./payroll-page-stubs')).RunControlStub,
}));

vi.mock('../../../../src/pages/payroll/PayrollSlipsTable', async () => ({
  PayrollSlipsTable: (await import('./payroll-page-stubs')).SlipsTableStub,
}));

function answer(result: { data?: unknown; loading?: boolean }) {
  gql.summary.mockReturnValue({ loading: false, refetch: gql.refetch, ...result });
}

/** The figure a stat tile shows under its label row. */
const tile = (label: string) =>
  screen.getByText(label).parentElement?.nextElementSibling?.textContent ?? '';

describe('PayrollPage', () => {
  beforeEach(() => {
    freezeOctober2026();
    gql.refetch.mockReset().mockResolvedValue({});
    gql.summary.mockReset();
    answer({ data: { payrollSummary: SUMMARY } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens on the current month and reads its summary fresh', () => {
    renderWithProviders(<PayrollPage />);

    expect(screen.getByRole('combobox', { name: /Month/ })).toHaveTextContent('October');
    expect(screen.getByLabelText('Year')).toHaveValue(2026);
    expect(screen.getByRole('button', { name: 'Run October 2026 (10/2026)' })).toBeInTheDocument();
    expect(gql.summary).toHaveBeenCalledWith({
      variables: { month: 10, year: 2026 },
      fetchPolicy: 'cache-and-network',
    });
  });

  it("totals the month's slips, payments and money", () => {
    renderWithProviders(<PayrollPage />);

    expect(tile('Slips')).toBe('5');
    expect(tile('Paid')).toBe('2');
    expect(tile('Total gross')).toBe(formatMoney(250000));
    expect(tile('Total deductions')).toBe(formatMoney(12500));
    expect(tile('Total net')).toBe(formatMoney(237500));
    expect(screen.getByText('Slips for 10/2026 at 5-2')).toBeInTheDocument();
  });

  it('shows placeholders, not zeros, until the summary first answers', () => {
    answer({ loading: true });
    renderWithProviders(<PayrollPage />);

    expect(tile('Slips')).toBe('');
    expect(screen.getByText('Slips for 10/2026 at undefined-undefined')).toBeInTheDocument();
  });

  it('counts an empty month as zeros and offers nothing to pay or email', () => {
    answer({ data: undefined, loading: false });
    renderWithProviders(<PayrollPage />);

    expect(tile('Slips')).toBe('0');
    expect(tile('Total net')).toBe(formatMoney(0));
    expect(screen.getByRole('button', { name: 'Mark paid' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Email payslips' })).toBeDisabled();
  });

  it('switches to another month and year', async () => {
    renderWithProviders(<PayrollPage />);

    await userEvent.click(screen.getByRole('combobox', { name: /Month/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'March' }),
    );
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } });

    expect(screen.getByRole('button', { name: 'Run March 2025 (3/2025)' })).toBeInTheDocument();
    expect(gql.summary).toHaveBeenLastCalledWith({
      variables: { month: 3, year: 2025 },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('lists every month by name in the picker', async () => {
    renderWithProviders(<PayrollPage />);

    await userEvent.click(screen.getByRole('combobox', { name: /Month/ }));

    const names = within(screen.getByRole('listbox'))
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(names).toHaveLength(12);
    expect(names[0]).toBe('January');
    expect(names[11]).toBe('December');
  });

  it('re-reads the summary once a run has issued slips', async () => {
    renderWithProviders(<PayrollPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Run October 2026 (10/2026)' }));

    await waitFor(() => expect(gql.refetch).toHaveBeenCalledTimes(1));
  });

  it('cannot mark a month paid once every slip is paid', () => {
    answer({ data: { payrollSummary: { ...SUMMARY, paid: 5 } } });
    renderWithProviders(<PayrollPage />);

    expect(screen.getByRole('button', { name: 'Mark paid' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Email payslips' })).toBeEnabled();
  });
});

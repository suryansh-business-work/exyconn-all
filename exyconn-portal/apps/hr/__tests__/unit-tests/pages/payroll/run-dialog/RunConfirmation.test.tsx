import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayrollCandidateStatus } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { RunConfirmation } from '../../../../../src/pages/payroll/run-dialog/RunConfirmation';
import { SelectionTotalsBar } from '../../../../../src/pages/payroll/run-dialog/SelectionTotalsBar';
import { renderWithProviders } from '../../../test-utils';
import { EMPLOYEES, candidate } from './run-plan-fixture';

const READY = EMPLOYEES.filter((c) => c.status === PayrollCandidateStatus.Ready);

/** Ten ready employees, each netting 1000 × their number. */
const TEN = Array.from({ length: 10 }, (_unused, index) =>
  candidate(`p${index + 1}`, `Person ${index + 1}`, PayrollCandidateStatus.Ready, {
    gross: 2000,
    deductions: 100,
    net: 1000 * (index + 1),
  }),
);

describe('RunConfirmation', () => {
  it('asks to run the picked employees for the period, with their total net', () => {
    renderWithProviders(<RunConfirmation picked={READY} period="October 2026" />);

    expect(
      screen.getByText(
        `Run payroll for 2 employees for October 2026? Total net ${formatMoney(76500)}. Each employee gets a salary slip and a notification; this month cannot be run again for them.`,
      ),
    ).toBeInTheDocument();
  });

  it("lists each picked employee's net pay in their own currency", () => {
    renderWithProviders(<RunConfirmation picked={READY} period="October 2026" />);

    expect(screen.getByText('Asha')).toBeInTheDocument();
    expect(screen.getByText(formatMoney(47500, 'INR'))).toBeInTheDocument();
    expect(screen.getByText(formatMoney(29000, 'INR'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument();
  });

  it('counts an employee with no figures as netting nothing', () => {
    const blank = candidate('e9', 'Ira', PayrollCandidateStatus.Ready);
    renderWithProviders(<RunConfirmation picked={[blank]} period="October 2026" />);

    expect(screen.getByText(formatMoney(0))).toBeInTheDocument();
  });

  it('folds everybody after the first eight behind "Show all"', async () => {
    renderWithProviders(<RunConfirmation picked={TEN} period="October 2026" />);
    const toggle = screen.getByRole('button', { name: 'Show all 10' });

    expect(screen.getByText('Person 8')).toBeVisible();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(screen.getByText('Person 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show fewer' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Show all 10' })).toHaveAttribute(
        'aria-expanded',
        'false',
      ),
    );
  });
});

describe('SelectionTotalsBar', () => {
  it('announces the count and the money the picked employees add up to', () => {
    renderWithProviders(
      <SelectionTotalsBar totals={{ count: 2, gross: 80000, deductions: 3500, net: 76500 }} />,
    );
    const bar = screen.getByRole('status');

    expect(bar).toHaveAttribute('aria-live', 'polite');
    expect(bar).toHaveTextContent('Selected2');
    expect(bar).toHaveTextContent(`Total gross${formatMoney(80000)}`);
    expect(bar).toHaveTextContent(`Total deductions${formatMoney(3500)}`);
    expect(bar).toHaveTextContent(`Total net${formatMoney(76500)}`);
  });
});

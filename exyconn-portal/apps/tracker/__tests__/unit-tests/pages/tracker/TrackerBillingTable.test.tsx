import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayType } from '@exyconn/shell/graphql/generated';
import { TrackerBillingTable } from '../../../../src/pages/tracker/TrackerBillingTable';
import { renderWithProviders } from '../../test-utils';
import { billingRow } from './tracker.fixtures';

/** A recognisable stand-in for the report's currency formatter. */
const money = { format: (value: number) => `$${value.toFixed(2)}` } as Intl.NumberFormat;

const rowOf = (name: string) => {
  const row = screen.getByText(name).closest('tr');
  if (!row) {
    throw new Error(`No row for ${name}`);
  }
  return within(row);
};

describe('TrackerBillingTable', () => {
  it('lists hours, rate and amount per employee in the report currency', () => {
    renderWithProviders(
      <TrackerBillingTable
        rows={[
          billingRow(),
          billingRow({
            id: 'emp-2',
            name: 'Dev Mehta',
            email: 'dev@example.test',
            payType: PayType.Fixed,
            hours: 3,
            billingRate: 0,
            amount: 0,
            rated: false,
          }),
        ]}
        money={money}
        loading={false}
        onRefresh={vi.fn().mockResolvedValue({})}
      />,
    );
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Employee',
      'Email',
      'Pay type',
      'Hours',
      'Rate / hour',
      'Amount',
    ]);

    const asha = rowOf('Asha Rao');
    expect(asha.getByText('asha@example.test')).toBeInTheDocument();
    expect(asha.getByText('HOURLY')).toBeInTheDocument();
    expect(asha.getByText('12.5 h')).toBeInTheDocument();
    expect(asha.getByText('$40.00')).toBeInTheDocument();
    expect(asha.getByText('$500.00')).toBeInTheDocument();

    const dev = rowOf('Dev Mehta');
    expect(dev.getByText('FIXED')).toBeInTheDocument();
    expect(dev.getByText('3 h')).toBeInTheDocument();
    expect(dev.getByText('Not set')).toBeInTheDocument();
    expect(dev.getByText('$0.00')).toBeInTheDocument();
  });

  it('says plainly when the range has no tracked time, and can re-read it', async () => {
    const onRefresh = vi.fn().mockResolvedValue({});
    renderWithProviders(
      <TrackerBillingTable rows={[]} money={money} loading={false} onRefresh={onRefresh} />,
    );
    expect(screen.getByText('No tracked time in this range.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('marks the table busy while the report loads', () => {
    renderWithProviders(
      <TrackerBillingTable
        rows={[]}
        money={money}
        loading
        onRefresh={vi.fn().mockResolvedValue({})}
      />,
    );
    expect(screen.queryByText('No tracked time in this range.')).not.toBeInTheDocument();
    expect(screen.getByRole('table').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true');
  });
});

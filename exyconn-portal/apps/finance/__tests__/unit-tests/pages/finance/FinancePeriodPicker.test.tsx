import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancePeriodPicker } from '../../../../src/pages/finance/FinancePeriodPicker';
import { financePeriods } from '../../../../src/pages/finance/finance-period';
import { renderWithProviders } from '../../test-utils';

const PERIODS = financePeriods(new Date('2026-09-04T10:30:00.000Z'));

describe('FinancePeriodPicker', () => {
  it('shows the chosen period by its label', () => {
    renderWithProviders(
      <FinancePeriodPicker periods={PERIODS} value="last-6" onChange={vi.fn()} />,
    );

    expect(screen.getByRole('combobox', { name: /Period/ })).toHaveTextContent('Last 6 months');
  });

  it('offers every period and reports the key of the one picked', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FinancePeriodPicker periods={PERIODS} value="last-3" onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole('combobox', { name: /Period/ }));
    const listbox = screen.getByRole('listbox');
    expect(
      within(listbox)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['This month', 'Last 3 months', 'Last 6 months', 'Last 12 months']);
    await userEvent.click(within(listbox).getByRole('option', { name: 'Last 12 months' }));

    expect(onChange).toHaveBeenCalledWith('last-12');
  });
});

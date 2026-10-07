import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BudgetBar } from '../../../../../src/pages/projects/time-log/BudgetBar';
import { renderWithProviders } from '../../../test-utils';

const HOUR_MS = 3_600_000;

describe('BudgetBar', () => {
  it('fills to the share of the budget used, in the primary colour', () => {
    renderWithProviders(<BudgetBar trackedMs={50 * HOUR_MS} budgetHours={100} />);

    expect(screen.getByText('Tracked 50.0 h of budget 100 h')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Budget used' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveClass('MuiLinearProgress-colorPrimary');
  });

  it('is still within budget at exactly the agreed hours', () => {
    renderWithProviders(<BudgetBar trackedMs={10 * HOUR_MS} budgetHours={10} />);

    expect(screen.getByText('Tracked 10.0 h of budget 10 h')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('turns red past the budget and names the overrun instead of hiding it', () => {
    renderWithProviders(<BudgetBar trackedMs={120.5 * HOUR_MS} budgetHours={100} />);

    expect(screen.getByText('Tracked 120.5 h of budget 100 h — 20.5 h over')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Budget used' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveClass('MuiLinearProgress-colorError');
  });

  it('starts empty with nothing tracked', () => {
    renderWithProviders(<BudgetBar trackedMs={0} budgetHours={40} />);

    expect(screen.getByText('Tracked 0.0 h of budget 40 h')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});

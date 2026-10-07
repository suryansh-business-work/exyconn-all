import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { VarianceBar } from '../../../../src/pages/budget-variance/VarianceBar';
import { renderWithProviders } from '../../test-utils';

const bar = () => screen.getByRole('progressbar');

describe('VarianceBar', () => {
  it('draws no bar where there is no budget to be a share of', () => {
    renderWithProviders(<VarianceBar utilisation={null} />);

    expect(screen.getByText('No budget set')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('is green well under budget', () => {
    renderWithProviders(<VarianceBar utilisation={42.4} />);

    expect(bar()).toHaveAttribute('aria-valuenow', '42.4');
    expect(bar()).toHaveClass('MuiLinearProgress-colorSuccess');
    expect(screen.getByText('42% used')).toBeInTheDocument();
  });

  it('turns amber from 90% of the budget', () => {
    renderWithProviders(<VarianceBar utilisation={90} />);

    expect(bar()).toHaveClass('MuiLinearProgress-colorWarning');
    expect(screen.getByText('90% used')).toBeInTheDocument();
  });

  it('stays amber at exactly the budget, and turns red only past it', () => {
    const { unmount } = renderWithProviders(<VarianceBar utilisation={100} />);
    expect(bar()).toHaveClass('MuiLinearProgress-colorWarning');
    unmount();

    renderWithProviders(<VarianceBar utilisation={135} />);
    expect(bar()).toHaveClass('MuiLinearProgress-colorError');
  });

  it('stops the bar at full while the number says how far past it went', () => {
    renderWithProviders(<VarianceBar utilisation={135} />);

    expect(bar()).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('135% used')).toBeInTheDocument();
  });
});

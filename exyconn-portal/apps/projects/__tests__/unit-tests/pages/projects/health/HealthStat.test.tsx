import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { HealthStat } from '../../../../../src/pages/projects/health/HealthStat';
import { renderWithProviders } from '../../../test-utils';

describe('HealthStat', () => {
  it('shows the label and the figure, with no bar when there is nothing to plot', () => {
    renderWithProviders(<HealthStat label="Team" value="4" />);

    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('leaves out the bar when the percentage is explicitly absent', () => {
    renderWithProviders(<HealthStat label="Progress" value="Not tracked" percent={null} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('draws a bar for a real zero', () => {
    renderWithProviders(<HealthStat label="Progress" value="0%" percent={0} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('stops the bar at full while the figure says how far past it went', () => {
    renderWithProviders(<HealthStat label="Hours" value="130%" percent={130} color="error" />);

    expect(screen.getByText('130%')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveClass('MuiLinearProgress-colorError');
  });

  it('uses the primary colour by default and shows the hint under the value', () => {
    renderWithProviders(<HealthStat label="Hours" value="50%" percent={50} hint="50 logged" />);

    expect(screen.getByRole('progressbar')).toHaveClass('MuiLinearProgress-colorPrimary');
    expect(screen.getByText('50 logged')).toBeInTheDocument();
  });
});

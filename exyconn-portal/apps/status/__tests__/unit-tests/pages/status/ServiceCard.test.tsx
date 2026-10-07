import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { formatWith } from '@exyconn/shell/utils/date';
import { StatusState } from '@exyconn/shell/graphql/generated';
import { ServiceCard } from '../../../../src/pages/status/ServiceCard';
import { TIME_FORMAT } from '../../../../src/status.constants';
import { renderWithProviders } from '../../test-utils';
import { hrPortal } from './status.fixtures';

describe('ServiceCard', () => {
  it('links the service and shows its 30-day uptime, latency, state and last check', () => {
    const hr = hrPortal({ lastError: 'HTTP 502' });
    renderWithProviders(<ServiceCard service={hr} divided={false} underMaintenance={false} />);

    const link = screen.getByRole('link', { name: 'HR Portal' });
    expect(link).toHaveAttribute('href', 'https://hr.exyconn.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('People, leave and payroll')).toBeInTheDocument();
    expect(screen.getByText('99.8% · 2400 ms')).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(
      screen.getByText(`Last checked ${formatWith(hr.lastCheckedAt, TIME_FORMAT)} · HTTP 502`),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Daily uptime' })).toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('holds back the figures until the first check rather than showing zeros', () => {
    renderWithProviders(
      <ServiceCard
        service={hrPortal({ state: StatusState.Unknown, lastCheckedAt: null, uptime30d: 0 })}
        divided
        underMaintenance={false}
      />,
    );
    // Once on the state chip, once as the last-checked line.
    expect(screen.getAllByText('Not checked yet')).toHaveLength(2);
    expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('reads "Maintenance" during a live window, whatever the probe says', () => {
    renderWithProviders(
      <ServiceCard
        service={hrPortal({ state: StatusState.Down })}
        divided={false}
        underMaintenance
      />,
    );
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.queryByText('Down')).not.toBeInTheDocument();
  });
});

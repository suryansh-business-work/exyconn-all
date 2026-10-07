import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { formatWith } from '@exyconn/shell/utils/date';
import { MaintenanceNotice } from '../../../../src/pages/status/MaintenanceNotice';
import { TIME_FORMAT } from '../../../../src/status.constants';
import { renderWithProviders } from '../../test-utils';
import { hrPortal, maintenanceWindow, service } from './status.fixtures';

const services = [service(), hrPortal()];

describe('MaintenanceNotice', () => {
  it('renders nothing when no maintenance is planned', () => {
    renderWithProviders(<MaintenanceNotice maintenance={[]} services={services} />);
    expect(screen.queryByText('Scheduled maintenance')).not.toBeInTheDocument();
  });

  it('flags a window under way and names what it covers in catalogue order', () => {
    const live = maintenanceWindow({
      title: 'Core upgrade',
      affectedServiceKeys: ['hr', 'website', 'retired-service'],
      inProgress: true,
      body: 'Expect a short outage.\nWe will post when done.',
    });
    renderWithProviders(<MaintenanceNotice maintenance={[live]} services={services} />);

    expect(screen.getByText('Scheduled maintenance')).toBeInTheDocument();
    expect(screen.getByText('Core upgrade')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText(/→/)).toHaveTextContent(
      `${formatWith(live.startsAt, TIME_FORMAT)} → ${formatWith(live.endsAt, TIME_FORMAT)} · Website, HR Portal`,
    );
    expect(screen.getByText(/Expect a short outage/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('announces an upcoming window that covers everything, without a body', () => {
    renderWithProviders(
      <MaintenanceNotice
        maintenance={[maintenanceWindow({ inProgress: null })]}
        services={services}
      />,
    );
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText(/→/)).toHaveTextContent(/· All services$/);
    expect(screen.queryByText('In progress')).not.toBeInTheDocument();
  });
});

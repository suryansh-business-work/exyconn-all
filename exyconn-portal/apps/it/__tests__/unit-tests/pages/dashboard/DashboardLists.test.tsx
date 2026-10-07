import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DashboardLists } from '../../../../src/pages/dashboard/DashboardLists';
import { emptyDashboard, fullDashboard } from './dashboard.fixtures';
import { renderWithProviders } from '../../test-utils';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../../core/settings.mock')).settingsModuleMock(),
);

describe('DashboardLists', () => {
  it('says what is missing rather than leaving a list blank', () => {
    renderWithProviders(<DashboardLists dashboard={emptyDashboard()} />);
    expect(screen.getByText('Recent incidents')).toBeInTheDocument();
    expect(screen.getByText('No incidents recorded.')).toBeInTheDocument();
    expect(screen.getByText('Upcoming changes')).toBeInTheDocument();
    expect(screen.getByText('No changes scheduled.')).toBeInTheDocument();
    expect(screen.getByText('Announcements')).toBeInTheDocument();
    expect(screen.getByText('Nothing announced.')).toBeInTheDocument();
  });

  it('shows each incident by status, each change by risk and each announcement by kind', () => {
    renderWithProviders(<DashboardLists dashboard={fullDashboard()} />);
    expect(screen.getByText('VPN down')).toBeInTheDocument();
    expect(screen.getByText('INVESTIGATING')).toBeInTheDocument();
    expect(screen.getByText('at 2026-10-05T08:00')).toBeInTheDocument();

    expect(screen.getByText('Upgrade Mongo')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('at 2026-10-10T10:00')).toBeInTheDocument();

    expect(screen.getByText('Firewall maintenance')).toBeInTheDocument();
    expect(screen.getByText('MAINTENANCE')).toBeInTheDocument();
    expect(screen.getByText('on 2026-10-01')).toBeInTheDocument();

    expect(screen.queryByText('No incidents recorded.')).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { StatusOverviewDocument, StatusState } from '@exyconn/shell/graphql/generated';
import { StatusPage } from '../../../../src/pages/status';
import { HISTORY_DAYS } from '../../../../src/status.constants';
import { renderWithProviders } from '../../test-utils';
import {
  dayPoint,
  hrPortal,
  maintenanceWindow,
  overview,
  overviewMock,
  service,
} from './status.fixtures';

describe('StatusPage states', () => {
  it('shows a spinner while the first answer is on its way', async () => {
    renderWithProviders(<StatusPage />, { mocks: [overviewMock(HISTORY_DAYS, overview())] });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByText('All systems operational')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('says why the page could not load', async () => {
    renderWithProviders(<StatusPage />, {
      mocks: [
        {
          request: { query: StatusOverviewDocument, variables: { days: HISTORY_DAYS } },
          error: new Error('Gateway timeout'),
        },
      ],
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Gateway timeout');
  });

  it('marks only the services a live maintenance window covers, and drops empty categories', async () => {
    const value = overview({
      services: [service(), hrPortal()],
      maintenance: [
        maintenanceWindow({
          id: 'live',
          title: 'HR migration',
          affectedServiceKeys: ['hr'],
          inProgress: true,
        }),
        maintenanceWindow({ id: 'next', title: 'Site refresh', affectedServiceKeys: ['website'] }),
      ],
    });
    renderWithProviders(<StatusPage />, { mocks: [overviewMock(HISTORY_DAYS, value)] });

    expect(await screen.findByText('Scheduled maintenance')).toBeInTheDocument();
    expect(screen.getAllByText('Maintenance')).toHaveLength(1);
    expect(screen.queryByText('Degraded')).not.toBeInTheDocument();
    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(screen.getByText('Portals')).toBeInTheDocument();
    expect(screen.queryByText('APIs')).not.toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
    expect(screen.getByText(`Services · last ${HISTORY_DAYS} days`)).toBeInTheDocument();
  });

  it('reads as "no data yet" rather than an outage before the first check', async () => {
    const value = overview({
      state: StatusState.Unknown,
      operational: 0,
      degraded: 0,
      services: [service({ state: StatusState.Unknown, lastCheckedAt: null, days: [] })],
      total: 1,
      daily: [dayPoint('2026-09-03', 0)],
    });
    renderWithProviders(<StatusPage />, { mocks: [overviewMock(HISTORY_DAYS, value)] });

    expect(await screen.findByText('Waiting for the first check')).toBeInTheDocument();
    expect(
      screen.getByText('Daily charts appear once the monitor has collected a full day of checks.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No incidents recorded. Every service has answered every check.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText('Scheduled maintenance')).not.toBeInTheDocument();
  });
});

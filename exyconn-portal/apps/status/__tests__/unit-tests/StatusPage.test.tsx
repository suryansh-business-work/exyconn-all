import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { theme } from '@exyconn/shell/config/theme';
import { StatusOverviewDocument } from '@exyconn/shell/graphql/generated';
import { StatusPage } from '../../src/pages/status';
import { HISTORY_DAYS } from '../../src/status.constants';

const day = (date: string, checks: number, failures: number) => ({
  __typename: 'StatusDayPoint',
  date,
  uptimePercent: checks === 0 ? 0 : ((checks - failures) / checks) * 100,
  avgResponseMs: 180,
  checks,
  failures,
});

const overview = {
  __typename: 'StatusOverview',
  state: 'DEGRADED',
  generatedAt: '2026-09-03T09:00:00.000Z',
  checkIntervalMinutes: 5,
  total: 2,
  operational: 1,
  degraded: 1,
  down: 0,
  uptimeToday: 99.5,
  uptime30d: 99.9,
  avgResponseMs: 180,
  services: [
    {
      __typename: 'StatusServiceSummary',
      id: '1',
      key: 'website',
      name: 'Website',
      description: 'The public exyconn.com site',
      category: 'WEBSITE',
      url: 'https://exyconn.com',
      state: 'OPERATIONAL',
      responseMs: 120,
      lastCheckedAt: '2026-09-03T08:59:00.000Z',
      lastError: '',
      uptimeToday: 100,
      uptime30d: 100,
      days: [day('2026-09-02', 288, 0), day('2026-09-03', 100, 0)],
    },
    {
      __typename: 'StatusServiceSummary',
      id: '2',
      key: 'hr',
      name: 'HR Portal',
      description: 'People, leave and payroll administration',
      category: 'PORTAL',
      url: 'https://hr.exyconn.com',
      state: 'DEGRADED',
      responseMs: 2400,
      lastCheckedAt: '2026-09-03T08:59:00.000Z',
      lastError: '',
      uptimeToday: 99,
      uptime30d: 99.8,
      days: [day('2026-09-02', 288, 2), day('2026-09-03', 100, 1)],
    },
  ],
  daily: [day('2026-09-02', 576, 2), day('2026-09-03', 200, 1)],
  incidents: [
    {
      __typename: 'StatusIncident',
      id: 'i1',
      serviceKey: 'hr',
      serviceName: 'HR Portal',
      state: 'DOWN',
      reason: 'HTTP 502',
      startedAt: '2026-09-02T04:00:00.000Z',
      resolvedAt: '2026-09-02T04:20:00.000Z',
      durationMinutes: 20,
    },
  ],
};

const mocks = [
  {
    request: { query: StatusOverviewDocument, variables: { days: HISTORY_DAYS } },
    result: { data: { statusOverview: overview } },
  },
];

const renderPage = () =>
  render(
    <MockedProvider mocks={mocks}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <StatusPage />
        </MemoryRouter>
      </ThemeProvider>
    </MockedProvider>,
  );

describe('StatusPage', () => {
  it('headlines the overall state and every monitored service', async () => {
    renderPage();

    expect(await screen.findByText('Degraded performance')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 services operational', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Website' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'HR Portal' })).toBeInTheDocument();
  });

  it('groups the services by category', async () => {
    renderPage();

    expect(await screen.findByText('Website', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Portals')).toBeInTheDocument();
  });

  it('lists the recent incidents with how long they lasted', async () => {
    renderPage();

    expect(await screen.findByText(/20 min/)).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('reports the summary numbers from the overview', async () => {
    renderPage();

    expect(await screen.findByText('99.5%')).toBeInTheDocument();
    expect(screen.getByText('180 ms')).toBeInTheDocument();
  });
});

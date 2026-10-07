import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { color } from '@exyconn/shell/components/ui';
import { StatusState } from '@exyconn/shell/graphql/generated';
import { TechOverviewPage } from '../../../../src/pages/overview';
import { renderWithProviders } from '../../test-utils';
import { tableProps } from '../ops-table.stub';
import { email, problemStats, service, status } from './overview.fixtures';
import { answerAll as answerWith, overview, overviewProps as props } from './overview.harness';

const gql = vi.hoisted(() => ({
  status: vi.fn(),
  email: vi.fn(),
  reports: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useStatusOverviewQuery: gql.status,
  useEmailDashboardQuery: gql.email,
  useListProblemReportsStatsQuery: gql.reports,
}));
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../logs/log.fixtures')).settingsModule(),
);
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('../ops-table.stub')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', async () =>
  (await import('./overview.harness')).moduleOverviewModule(),
);

const stat = (label: string) => props().stats.find((item) => item.label === label);
const answerAll = (statusData = status(), emailData = email(), reportsData = problemStats()) =>
  answerWith(gql, statusData, emailData, reportsData);

describe('TechOverviewPage', () => {
  beforeEach(() => {
    overview.props = null;
    for (const spy of Object.values(gql)) {
      spy.mockReset();
    }
    answerAll();
  });

  it('reads a week of status and email, and the report counts', () => {
    renderWithProviders(<TechOverviewPage />);

    expect(gql.status).toHaveBeenCalledWith({
      variables: { days: 7 },
      fetchPolicy: 'cache-and-network',
    });
    expect(gql.email).toHaveBeenCalledWith({ variables: { days: 7 } });
    expect(gql.reports).toHaveBeenCalledWith();
    expect(props().title).toBe('Tech');
    expect(props().links?.map((link) => link.to)).toEqual([
      '/tech/environment-variables',
      '/tech/email',
      '/tech/status-monitors',
      '/tech/problem-reports',
      '/tech/tracker-build',
    ]);
  });

  it('is all green while every service answers and nothing is open', () => {
    answerAll(status(), email({ failed: 0 }), problemStats({ fresh: 0, inProgress: 0 }));
    renderWithProviders(<TechOverviewPage />);

    expect(props().statsLoading).toBe(false);
    expect(stat('Services answering')).toMatchObject({
      value: '10 / 10',
      accent: color.green[500],
    });
    expect(stat('Uptime, 30 days')).toMatchObject({
      value: '99.9%',
      accent: color.blue[400],
      series: [100, 99.5],
    });
    expect(stat('Email sent, {days}d')).toMatchObject({
      value: '42',
      labelValues: { days: 7 },
      accent: color.violet[400],
      series: [20, 22],
    });
    expect(stat('Open problem reports')).toMatchObject({ value: '0', accent: color.green[500] });
  });

  it('turns amber for a degraded service, failed email or an open report', () => {
    answerAll(
      status({ degraded: 1, operational: 9 }),
      email({ failed: 2 }),
      problemStats({ fresh: 2 }),
    );
    renderWithProviders(<TechOverviewPage />);

    expect(stat('Services answering')).toMatchObject({ value: '9 / 10', accent: color.amber[500] });
    expect(stat('Email sent, {days}d')?.accent).toBe(color.amber[500]);
    expect(stat('Open problem reports')).toMatchObject({ value: '3', accent: color.amber[500] });
  });

  it('turns red the moment a service is down', () => {
    answerAll(status({ down: 1, degraded: 1, operational: 8 }));
    renderWithProviders(<TechOverviewPage />);

    expect(stat('Services answering')?.accent).toBe(color.red[200]);
  });

  it('lists the first eight monitored services when all of them are healthy', () => {
    renderWithProviders(<TechOverviewPage />);

    expect(screen.getByRole('heading', { name: 'Monitored services' })).toBeInTheDocument();
    expect(tableProps().rows.map((row) => row.id)).toEqual([
      's-0',
      's-1',
      's-2',
      's-3',
      's-4',
      's-5',
      's-6',
      's-7',
    ]);
    expect(tableProps().onRefresh).toBe(gql.refetch);
  });

  it('puts only the services that are not answering normally at the top', () => {
    const services = [
      service(0),
      service(1, { state: StatusState.Down }),
      service(2, { state: StatusState.Degraded }),
    ];
    answerAll(status({ services }));
    renderWithProviders(<TechOverviewPage />);

    expect(screen.getByRole('heading', { name: 'Not answering normally' })).toBeInTheDocument();
    expect(tableProps().rows.map((row) => row.id)).toEqual(['s-1', 's-2']);
  });

  it('renders each service’s state, response time, uptime and last check', () => {
    renderWithProviders(<TechOverviewPage />);

    expect(screen.getByTestId('s-0-name')).toHaveTextContent('Service 0');
    expect(screen.getByTestId('s-0-category')).toHaveTextContent('PORTAL');
    expect(screen.getByTestId('s-0-state')).toHaveTextContent('OPERATIONAL');
    expect(screen.getByTestId('s-0-responseMs')).toHaveTextContent('120 ms');
    expect(screen.getByTestId('s-0-uptime30d')).toHaveTextContent('99.5%');
    expect(screen.getByTestId('s-0-lastCheckedAt')).toHaveTextContent(
      'at 2026-10-07T09:55:00.000Z',
    );
  });

  it('breaks reports down by severity and email down by template', () => {
    renderWithProviders(<TechOverviewPage />);

    expect(props().breakdowns).toEqual([
      {
        title: 'Problem reports by severity',
        buckets: [{ value: 'CRITICAL', count: 1 }],
        accent: color.red[200],
      },
      {
        title: 'Email by template, {days}d',
        titleValues: { days: 7 },
        buckets: [{ value: 'Payslip ready', count: 30 }],
        accent: color.violet[400],
      },
    ]);
  });

  it('shows placeholders and zeros until the first answers arrive', () => {
    gql.status.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    gql.email.mockReturnValue({ data: undefined, loading: true });
    gql.reports.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<TechOverviewPage />);

    expect(props().statsLoading).toBe(true);
    expect(props().stats.map((item) => item.value)).toEqual(['0 / 0', '0.0%', '0', '0']);
    expect(props().breakdowns?.map((item) => item.buckets)).toEqual([[], []]);
    expect(screen.getByText('No services are being monitored yet.')).toBeInTheDocument();
  });

  it('keeps the tiles loading while any one source has not answered', () => {
    gql.email.mockReturnValue({ data: undefined, loading: true });
    const { unmount } = renderWithProviders(<TechOverviewPage />);
    expect(props().statsLoading).toBe(true);
    unmount();

    answerAll();
    gql.reports.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<TechOverviewPage />);
    expect(props().statsLoading).toBe(true);
  });
});

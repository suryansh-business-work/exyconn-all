import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { EmailDashboardPanel } from '../../../../src/pages/email/EmailDashboardPanel';
import { renderWithProviders } from '../../test-utils';
import { propsOf, resetHarness, table } from '../environment-variables/panel.harness';

const gql = vi.hoisted(() => ({ dashboard: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useEmailDashboardQuery: gql.dashboard,
}));
vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value}` }),
}));
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => {
  const stubs = await import('./chart-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
    ChartCard: stubs.ChartCardStub,
    TrendChart: stubs.TrendChartStub,
  };
});
vi.mock('@exyconn/shell/components/dashboard/StatBreakdown', async () =>
  (await import('../environment-variables/panel.harness')).propsModule('StatBreakdown'),
);
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('../environment-variables/panel.harness')).dataTableModule(),
);

const FAILURE = {
  id: 'log-1',
  templateKey: 'invoice',
  templateName: 'Invoice',
  to: 'client@example.test',
  subject: 'Your invoice',
  status: 'FAILED',
  error: 'Mailbox unavailable',
  triggeredBy: 'system',
  sentAt: '2026-09-05T10:00:00.000Z',
};

const board = (overrides: Record<string, unknown> = {}) => ({
  templates: 12,
  activeTemplates: 9,
  fragments: 4,
  sent: 340,
  failed: 3,
  configured: true,
  days: [
    { date: '2026-09-04', sent: 5, failed: 0 },
    { date: '2026-09-05', sent: 12, failed: 3 },
  ],
  byTemplate: [
    { key: 'welcome', name: 'Welcome', sent: 10, failed: 1 },
    { key: 'invoice', name: '', sent: 2, failed: 2 },
  ],
  recentFailures: [FAILURE],
  ...overrides,
});

const answer = (data: unknown, loading = false) =>
  gql.dashboard.mockReturnValue({ data, loading, refetch: gql.refetch });

describe('EmailDashboardPanel', () => {
  beforeEach(() => {
    resetHarness();
    gql.dashboard.mockReset();
  });

  it('asks for two weeks of sending, refreshing in the background', () => {
    answer({ emailDashboard: board() });
    renderWithProviders(<EmailDashboardPanel />);
    expect(gql.dashboard).toHaveBeenCalledWith({
      variables: { days: 14 },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('shows a spinner until the first answer arrives', () => {
    answer(undefined, true);
    renderWithProviders(<EmailDashboardPanel />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('Templates')).not.toBeInTheDocument();
  });

  it('counts templates, active ones, and what was sent and failed in the window', () => {
    answer({ emailDashboard: board() });
    renderWithProviders(<EmailDashboardPanel />);
    for (const text of ['Templates', '12', 'Active', '9', 'Sent · 14d', '340', 'Failed · 14d']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.queryByText(/No active SMTP configuration/)).not.toBeInTheDocument();
  });

  it('leads with an alarm when no SMTP account is active', () => {
    answer({ emailDashboard: board({ configured: false }) });
    renderWithProviders(<EmailDashboardPanel />);
    expect(
      screen.getByText(
        'No active SMTP configuration, so nothing can be sent. Add one under Settings.',
      ),
    ).toBeInTheDocument();
  });

  it('charts what was sent each day on a short date axis', () => {
    answer({ emailDashboard: board() });
    renderWithProviders(<EmailDashboardPanel />);
    const chart = within(screen.getByRole('region', { name: 'Sent per day' }));
    expect(chart.getByText('Table heading: Day')).toBeInTheDocument();
    expect(chart.getByText('Sent — 04 Sep: 5, 05 Sep: 12')).toBeInTheDocument();
  });

  it('ranks templates by everything they tried to send, by name or else by key', () => {
    answer({ emailDashboard: board() });
    renderWithProviders(<EmailDashboardPanel />);
    expect(propsOf('StatBreakdown')).toMatchObject({
      title: 'Busiest templates',
      emptyMessage: 'Nothing sent in this window.',
      buckets: [
        { value: 'Welcome', count: 11 },
        { value: 'invoice', count: 4 },
      ],
    });
  });

  it('lists recent failures with their reason, in the viewer’s own date format', () => {
    answer({ emailDashboard: board() }, true);
    renderWithProviders(<EmailDashboardPanel />);
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    const row = within(screen.getByTestId('row-log-1'));
    for (const text of ['at 2026-09-05T10:00:00.000Z', 'Invoice', 'client@example.test']) {
      expect(row.getByText(text)).toBeInTheDocument();
    }
    expect(row.getByText('Mailbox unavailable')).toBeInTheDocument();
    expect(table.props).toMatchObject({
      emptyMessage: 'Nothing has failed recently.',
      loading: true,
      onRefresh: gql.refetch,
    });
  });

  it('reads as resolved, with nothing charted, when the board is empty', () => {
    answer(undefined, false);
    renderWithProviders(<EmailDashboardPanel />);
    expect(screen.getByText('RESOLVED')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4);
    expect(screen.getByText('Nothing sent in this window.')).toBeInTheDocument();
    expect(screen.getByText('Nothing has failed recently.')).toBeInTheDocument();
    expect(propsOf('StatBreakdown').buckets).toEqual([]);
    expect(screen.queryByText(/No active SMTP configuration/)).not.toBeInTheDocument();
  });
});

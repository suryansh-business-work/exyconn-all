import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatDate } from '@exyconn/i18n';
import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { AnalyticsTab } from '../../../../src/pages/social/AnalyticsTab';
import { renderWithProviders } from '../../test-utils';
import { postRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ analytics: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialAnalyticsQuery: (options: unknown) => gql.analytics(options),
}));

interface ChartProps {
  title: string;
  points?: { period: string; value: number }[];
  metrics?: { label: string; value: number }[];
  formatValue: (value: number) => string;
  formatPeriod?: (period: string) => string;
}

vi.mock('@exyconn/shell/components/dashboard/StatRow', () => ({
  StatRow: ({ stats }: Readonly<{ stats: { label: string; value: string }[] }>) => (
    <ul aria-label="tiles">
      {stats.map((stat) => (
        <li key={stat.label}>{`${stat.label}: ${stat.value}`}</li>
      ))}
    </ul>
  ),
}));
vi.mock('@exyconn/shell/components/dashboard/PointChart', () => ({
  PointChart: ({ title, points = [], formatValue, formatPeriod }: Readonly<ChartProps>) => (
    <ul aria-label={title}>
      {points.map((point) => (
        <li key={point.period}>{`${formatPeriod?.(point.period)}: ${formatValue(point.value)}`}</li>
      ))}
    </ul>
  ),
}));
vi.mock('@exyconn/shell/components/dashboard/MetricChart', () => ({
  MetricChart: ({ title, metrics = [], formatValue }: Readonly<ChartProps>) => (
    <ul aria-label={title}>
      {metrics.map((metric) => (
        <li key={metric.label}>{`${metric.label}: ${formatValue(metric.value)}`}</li>
      ))}
    </ul>
  ),
}));
vi.mock('../../../../src/pages/social/AiInsightsPanel', () => ({
  AiInsightsPanel: ({ days }: Readonly<{ days: number }>) => <p>{`AI over ${days} days`}</p>,
}));

const DAY = '2026-09-10T00:00:00.000Z';
const REPORT = {
  days: 30,
  posts: 12,
  likes: 1500,
  comments: 40,
  shares: 9,
  views: 20000.4,
  engagement: 1549,
  scheduled: 3,
  failed: 1,
  byNetwork: [{ network: SocialNetwork.Linkedin, posts: 5, engagement: 900, views: 9000 }],
  engagementPerDay: [{ period: DAY, value: 12.6 }],
  topPosts: [
    postRow({ id: 't1', text: 'y'.repeat(85), engagement: 300, publishedAt: DAY }),
    postRow({ id: 't2', network: SocialNetwork.X, text: 'Short one', publishedAt: null }),
  ],
};

const items = (name: string) =>
  within(screen.getByRole('list', { name }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

describe('AnalyticsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.analytics.mockReturnValue({ data: { socialAnalytics: REPORT }, loading: false });
  });

  it('reports the last 30 days by default, fresh from the network', () => {
    renderWithProviders(<AnalyticsTab />);

    expect(gql.analytics).toHaveBeenCalledWith({
      variables: { days: 30 },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByText('AI over 30 days')).toBeInTheDocument();
  });

  it('counts posts and their engagement as whole numbers', () => {
    renderWithProviders(<AnalyticsTab />);

    expect(items('tiles')).toEqual([
      'Posts: 12',
      `Engagement: ${(1549).toLocaleString()}`,
      `Likes: ${(1500).toLocaleString()}`,
      'Comments: 40',
      'Shares: 9',
      `Views: ${(20000).toLocaleString()}`,
      'Scheduled: 3',
      'Failed: 1',
    ]);
  });

  it('charts engagement per day and per network', () => {
    renderWithProviders(<AnalyticsTab />);

    expect(items('Engagement per day')).toEqual([
      `${formatDate(DAY, DEFAULT_FORMAT_SETTINGS)}: 13`,
    ]);
    expect(items('Engagement by network')).toEqual(['LinkedIn: 900']);
  });

  it('lists the top posts, shortening long ones', () => {
    renderWithProviders(<AnalyticsTab />);
    const [, first, second] = screen.getAllByRole('row');

    expect(within(first).getByText('Facebook')).toBeInTheDocument();
    expect(within(first).getByText(`${'y'.repeat(80)}…`)).toBeInTheDocument();
    expect(within(first).getByText('300')).toBeInTheDocument();
    expect(within(first).getByText(formatDate(DAY, DEFAULT_FORMAT_SETTINGS))).toBeInTheDocument();
    expect(within(second).getByText('X')).toBeInTheDocument();
    expect(within(second).getByText('Short one')).toBeInTheDocument();
    expect(within(second).getByText('—')).toBeInTheDocument();
  });

  it('switches the period, and keeps it when the chosen one is pressed again', async () => {
    renderWithProviders(<AnalyticsTab />);

    await userEvent.click(screen.getByRole('button', { name: '7 days' }));
    expect(gql.analytics).toHaveBeenLastCalledWith(
      expect.objectContaining({ variables: { days: 7 } }),
    );
    expect(screen.getByText('AI over 7 days')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '7 days' }));
    expect(screen.getByRole('button', { name: '7 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('AI over 7 days')).toBeInTheDocument();
  });

  it('shows a spinner before the first report and the error when it fails', () => {
    gql.analytics.mockReturnValue({ data: undefined, loading: true });
    const { unmount } = renderWithProviders(<AnalyticsTab />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    unmount();

    gql.analytics.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Quota hit'),
    });
    renderWithProviders(<AnalyticsTab />);
    expect(screen.getByText('Quota hit')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'tiles' })).not.toBeInTheDocument();
  });
});

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MarketingOverviewPage } from '../../../../src/pages/marketing';
import { renderWithProviders } from '../../test-utils';
import { answered, pending } from '../../fixtures';

interface OverviewProps {
  title: string;
  stats: { label: string; value: string }[];
  statsLoading: boolean;
  breakdowns: { title: string; buckets: { value: string; count: number }[] }[];
  links: { label: string; to: string }[];
  recentTitle: string;
  children: ReactNode;
}

const recorded = vi.hoisted(() => ({
  overview: null as unknown,
  dashboard: vi.fn(),
  leads: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMarketingDashboardQuery: (options: unknown) => recorded.dashboard(options),
  useCampaignLeadCountsQuery: () => recorded.leads(),
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    recorded.overview = props;
    return <section aria-label="overview">{props.children}</section>;
  },
}));

vi.mock('../../../../src/pages/marketing/DashboardActivity', () => ({
  DashboardActivity: ({ dashboard }: Readonly<{ dashboard: { campaigns: number } }>) => (
    <p>{`Activity of ${dashboard.campaigns} campaigns`}</p>
  ),
}));

const overview = () => recorded.overview as OverviewProps;
const stat = (label: string) => overview().stats.find((item) => item.label === label)?.value;

const DASHBOARD = {
  __typename: 'MarketingDashboard',
  campaigns: 12,
  drafts: 4,
  scheduled: 3,
  sending: 1,
  sentLast30: 2500,
  failedLast30: 7,
  clickedLast30: 300,
  clickRateLast30: 12,
  unsubscribesLast30: 9,
  suppressed: 41,
  audiences: 6,
  upcoming: [],
  recent: [],
  daily: [],
};

describe('MarketingOverviewPage', () => {
  beforeEach(() => {
    recorded.dashboard.mockReset();
    recorded.leads.mockReset();
    recorded.dashboard.mockReturnValue(answered({ marketingDashboard: DASHBOARD }));
    recorded.leads.mockReturnValue(
      answered({
        campaignLeadCounts: [
          { campaignId: 'c1', campaignName: 'Diwali offer', leads: 5 },
          { campaignId: 'c2', campaignName: 'Winter sale', leads: 3 },
        ],
      }),
    );
  });

  it('reads the tiles from the server dashboard, keeping it fresh', () => {
    renderWithProviders(<MarketingOverviewPage />);

    expect(recorded.dashboard).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(overview().title).toBe('Marketing');
    expect(overview().statsLoading).toBe(false);
    expect(overview().stats.map((item) => item.label)).toEqual([
      'Campaigns',
      'Scheduled',
      'Sent (30 days)',
      'Click rate (30 days)',
      'Unsubscribes (30 days)',
      'Leads generated',
    ]);
    expect(stat('Campaigns')).toBe('12');
    expect(stat('Scheduled')).toBe('3');
    expect(stat('Sent (30 days)')).toBe((2500).toLocaleString('en'));
    expect(stat('Click rate (30 days)')).toBe('12%');
    expect(stat('Unsubscribes (30 days)')).toBe('9');
  });

  it('adds up the leads every campaign brought in', () => {
    renderWithProviders(<MarketingOverviewPage />);
    expect(stat('Leads generated')).toBe('8');
  });

  it('breaks the campaigns down by delivery and reach', () => {
    renderWithProviders(<MarketingOverviewPage />);

    expect(overview().breakdowns).toMatchObject([
      {
        title: 'Campaigns by delivery',
        buckets: [
          { value: 'DRAFT', count: 4 },
          { value: 'QUEUED', count: 3 },
          { value: 'SENDING', count: 1 },
        ],
      },
      {
        title: 'Reach',
        buckets: [
          { value: 'AUDIENCES', count: 6 },
          { value: 'SUPPRESSED', count: 41 },
          { value: 'FAILED (30 DAYS)', count: 7 },
        ],
      },
    ]);
  });

  it('links to a new campaign and every marketing screen', () => {
    renderWithProviders(<MarketingOverviewPage />);

    expect(overview().links.map((link) => link.to)).toEqual([
      '/marketing/campaigns/new',
      '/marketing/campaigns',
      '/marketing/audiences',
      '/marketing/templates',
      '/marketing/preferences',
      '/marketing/suppression',
    ]);
    expect(overview().recentTitle).toBe('Activity');
  });

  it('shows the activity once the dashboard arrives', () => {
    renderWithProviders(<MarketingOverviewPage />);
    expect(screen.getByText('Activity of 12 campaigns')).toBeInTheDocument();
  });

  it('shows zeros, loading tiles and no breakdowns before anything arrives', () => {
    recorded.dashboard.mockReturnValue(pending());
    recorded.leads.mockReturnValue(pending());
    renderWithProviders(<MarketingOverviewPage />);

    expect(overview().statsLoading).toBe(true);
    expect(overview().stats.map((item) => item.value)).toEqual(['0', '0', '0', '0%', '0', '0']);
    expect(overview().breakdowns).toEqual([]);
    expect(screen.queryByText(/Activity of/)).toBeNull();
  });

  it('says why the dashboard could not load', () => {
    recorded.dashboard.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Dashboard unavailable'),
    });
    renderWithProviders(<MarketingOverviewPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('Dashboard unavailable');
    expect(overview().statsLoading).toBe(false);
  });
});

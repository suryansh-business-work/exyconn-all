import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { DEFAULT_FORMAT_SETTINGS, formatDate } from '@exyconn/i18n';
import { formatMoney } from '@exyconn/shell/utils/money';
import { MarketingOverviewPage } from '../../../../src/pages/marketing';
import { renderWithProviders } from '../../test-utils';
import { answered, campaignRow, pending, tableStats } from '../../fixtures';

interface OverviewProps {
  title: string;
  stats: { label: string; value: string }[];
  statsLoading: boolean;
  breakdowns: { title: string; buckets: unknown[] }[];
  links: { label: string; to: string }[];
  recentTitle: string;
  children: ReactNode;
}

const recorded = vi.hoisted(() => {
  const hooks: Record<string, () => unknown> = {};
  return { overview: null as unknown, hooks };
});

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCampaignsStatsQuery: () => recorded.hooks.stats(),
  useListCampaignsQuery: () => recorded.hooks.campaigns(),
  useCampaignLeadCountsQuery: () => recorded.hooks.leads(),
}));

vi.mock('@exyconn/shell/components/dashboard/ModuleOverview', () => ({
  ModuleOverview: (props: Readonly<OverviewProps>) => {
    recorded.overview = props;
    return <section aria-label="overview">{props.children}</section>;
  },
}));

const overview = () => recorded.overview as OverviewProps;
const stat = (label: string) => overview().stats.find((item) => item.label === label)?.value;

const CAMPAIGNS = [
  campaignRow({
    id: 'c1',
    name: 'Diwali offer',
    lastSentAt: '2026-10-02T00:00:00Z',
    recipientsCount: 120,
  }),
  campaignRow({ id: 'c2', name: 'Winter sale', recipientsCount: null }),
];
const STATS = tableStats(
  2,
  { status: { ACTIVE: 1, PLANNED: 1 }, channel: { EMAIL: 2 } },
  { budget: 240000 },
);

const loadedHooks = () => ({
  stats: () => answered({ listCampaignsStats: STATS }),
  campaigns: () => answered({ listCampaigns: CAMPAIGNS }),
  leads: () =>
    answered({
      campaignLeadCounts: [{ campaignId: 'c1', campaignName: 'Diwali offer', leads: 5 }],
    }),
});

describe('MarketingOverviewPage', () => {
  beforeEach(() => {
    recorded.hooks = loadedHooks();
  });

  it('adds up what ran, who it reached and what it brought in', () => {
    renderWithProviders(<MarketingOverviewPage />);

    expect(overview().title).toBe('Marketing');
    expect(overview().statsLoading).toBe(false);
    expect(stat('Campaigns')).toBe('2');
    expect(stat('Sent')).toBe('1');
    expect(stat('Recipients reached')).toBe('120');
    expect(stat('Leads generated')).toBe('5');
    expect(stat('Budget')).toBe(formatMoney(240000));
  });

  it('breaks the campaigns down by status and channel', () => {
    renderWithProviders(<MarketingOverviewPage />);

    expect(overview().breakdowns.map((breakdown) => breakdown.title)).toEqual([
      'By status',
      'By channel',
    ]);
    expect(overview().breakdowns[1].buckets).toEqual([{ value: 'EMAIL', count: 2 }]);
  });

  it('links to the campaigns, audiences and suppression list', () => {
    renderWithProviders(<MarketingOverviewPage />);

    expect(overview().links.map((link) => link.to)).toEqual([
      '/marketing/campaigns',
      '/marketing/audiences',
      '/marketing/suppression',
    ]);
    expect(overview().recentTitle).toBe('Newest campaigns');
  });

  it.each(['stats', 'campaigns', 'leads'])(
    'marks the tiles loading while %s has not answered',
    (hook) => {
      recorded.hooks = { ...loadedHooks(), [hook]: pending };
      renderWithProviders(<MarketingOverviewPage />);

      expect(overview().statsLoading).toBe(true);
    },
  );

  it('shows zeros and empty breakdowns before anything arrives', () => {
    recorded.hooks = { stats: pending, campaigns: pending, leads: pending };
    renderWithProviders(<MarketingOverviewPage />);

    expect(overview().stats.map((item) => item.value)).toEqual([
      '0',
      '0',
      '0',
      '0',
      formatMoney(0),
    ]);
    expect(overview().breakdowns.map((breakdown) => breakdown.buckets)).toEqual([[], []]);
  });

  it('lists the newest campaigns with their start date and the leads each brought', () => {
    renderWithProviders(<MarketingOverviewPage />);
    const [, first, second] = screen.getAllByRole('row');

    expect(within(first).getByText('Diwali offer')).toBeInTheDocument();
    expect(within(first).getByText('ACTIVE')).toBeInTheDocument();
    expect(
      within(first).getByText(formatDate(CAMPAIGNS[0].startDate, DEFAULT_FORMAT_SETTINGS)),
    ).toBeInTheDocument();
    expect(within(first).getByText('120')).toBeInTheDocument();
    expect(within(first).getByText('5')).toBeInTheDocument();
    expect(within(second).getByText('Winter sale')).toBeInTheDocument();
    expect(within(second).getByText('0')).toBeInTheDocument();
  });

  it('stops the list at the eight newest campaigns', () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      campaignRow({ id: `c${index}`, name: `Campaign ${index}` }),
    );
    recorded.hooks.campaigns = () => answered({ listCampaigns: many });
    renderWithProviders(<MarketingOverviewPage />);

    expect(screen.getByText('Campaign 7')).toBeInTheDocument();
    expect(screen.queryByText('Campaign 8')).not.toBeInTheDocument();
  });

  it('says there are no campaigns yet', () => {
    recorded.hooks.campaigns = () => answered({ listCampaigns: [] });
    renderWithProviders(<MarketingOverviewPage />);

    expect(screen.getByText('No campaigns yet.')).toBeInTheDocument();
  });
});

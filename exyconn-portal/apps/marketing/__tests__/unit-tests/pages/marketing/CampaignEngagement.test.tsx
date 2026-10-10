import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import type { ChartData } from '@exyconn/shell/components/ui';
import { CampaignEngagement } from '../../../../src/pages/marketing/CampaignEngagement';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ metrics: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignMetricsQuery: (options: unknown) => gql.metrics(options),
}));

interface ChartProps {
  title?: string;
  subtitle?: string;
  data: ChartData;
  formatValue: (value: number) => string;
  height?: number;
  children?: ReactNode;
}

/** Charts need a canvas jsdom lacks: the stand-ins list the labels and use the formatter. */
vi.mock('@exyconn/shell/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/ui')>()),
  ChartCard: ({ title, subtitle, data, formatValue, children }: Readonly<ChartProps>) => (
    <section aria-label={title}>
      <p>{subtitle}</p>
      <ul>
        {data.labels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
      <p>{`Card total ${formatValue(9)}`}</p>
      {children}
    </section>
  ),
  BarChart: ({ formatValue, height }: Readonly<ChartProps>) => (
    <p>{`Bars of ${formatValue(5)} at ${height}px`}</p>
  ),
}));

const METRICS = {
  campaignId: 'campaign-1',
  sent: 10,
  opened: 4,
  clicked: 2,
  totalOpens: 6,
  totalClicks: 3,
  openRate: 40,
  clickRate: 20,
  clickThroughRate: 50,
};
const LINKS = [
  { url: 'https://exyconn.com/pricing', clicks: 3, people: 2 },
  {
    url: 'https://exyconn.com/blog/a-very-long-article-slug-about-agents?utm=1',
    clicks: 1,
    people: 1,
  },
];

function answer(metrics: object | null, links: object[] = LINKS, loading = false) {
  gql.metrics.mockReturnValue({
    loading,
    data: metrics ? { campaignMetrics: metrics, campaignTopLinks: links } : undefined,
  });
}

describe('CampaignEngagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answer(METRICS);
  });

  it('shows the headline numbers of this campaign', () => {
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);

    expect(gql.metrics).toHaveBeenCalledWith({ variables: { campaignId: 'campaign-1' } });
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('4 people · 6 opens')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('2 people · 3 clicks')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('of those who opened')).toBeInTheDocument();
  });

  it('presents the open rate as a floor, in the plural', () => {
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'so this campaign was opened by at least 4 people. Clicks are exact.',
    );
  });

  it('uses the singular sentence when one person opened it', () => {
    answer({ ...METRICS, opened: 1 });
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);

    expect(screen.getByRole('alert')).toHaveTextContent('opened by at least 1 person.');
  });

  it('charts the most clicked links with readable, shortened addresses', () => {
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);
    const card = within(screen.getByRole('region', { name: 'Most clicked links' }));

    expect(card.getByText('Where the campaign actually sent people')).toBeInTheDocument();
    expect(card.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'exyconn.com/pricing',
      'exyconn.com/blog/a-very-long-article-sl…',
    ]);
    expect(card.getByText('Card total 9')).toBeInTheDocument();
    expect(card.getByText('Bars of 5 at 160px')).toBeInTheDocument();
  });

  it('grows the chart with the number of links', () => {
    const many = ['a', 'b', 'c', 'd', 'e'].map((slug) => ({
      url: `https://exyconn.com/${slug}`,
      clicks: 1,
      people: 1,
    }));
    answer(METRICS, many);
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);

    expect(screen.getByText('Bars of 5 at 210px')).toBeInTheDocument();
  });

  it('says no links have been clicked yet', () => {
    answer(METRICS, []);
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);

    expect(screen.getByText('No links have been clicked yet.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Most clicked links' })).not.toBeInTheDocument();
  });

  it('says it is loading until the first numbers arrive', () => {
    answer(null, [], true);
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);

    expect(screen.getByText('Loading engagement…')).toBeInTheDocument();
  });

  it.each([
    ['no numbers came back', null],
    ['nothing was sent', { ...METRICS, sent: 0 }],
  ])('has nothing to report when %s', (_case, metrics) => {
    answer(metrics);
    renderWithProviders(<CampaignEngagement campaignId="campaign-1" />);

    expect(
      screen.getByText('Nothing to report yet — this campaign has not been sent.'),
    ).toBeInTheDocument();
  });
});

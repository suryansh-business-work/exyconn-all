import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListCampaignsPagedDocument } from '@exyconn/shell/graphql/generated';
import { MarketingPage } from '../../../../src/pages/marketing';
import { CAMPAIGN_COLUMNS } from '../../../../src/pages/marketing/campaigns-grid';
import { renderWithProviders } from '../../test-utils';
import { campaignRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteCampaign: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCampaignsStatsQuery: () => gql.stats(),
  useDeleteCampaignMutation: () => [gql.deleteCampaign],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/marketing/forms/campaign', async () => ({
  CampaignForm: (await import('../../form-stub')).FormStub,
}));
vi.mock('../../../../src/pages/marketing/forms/send-campaign', async () => ({
  SendCampaignForm: (await import('../../form-stub')).FormStub,
}));
vi.mock('../../../../src/pages/marketing/CampaignDetails', () => ({
  CampaignDetails: ({ campaign }: Readonly<{ campaign: { name: string } }>) => (
    <p>{`Details of ${campaign.name}`}</p>
  ),
}));

const STATS = tableStats(
  6,
  { status: { ACTIVE: 2, PLANNED: 4 }, lastSentAt: { null: 4 } },
  { budget: 450000 },
);

describe('MarketingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteCampaign.mockResolvedValue({ data: { deleteCampaign: true } });
    gql.stats.mockReturnValue({
      data: { listCampaignsStats: STATS },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('reads the campaign tiles from one stats aggregation', () => {
    renderWithProviders(<MarketingPage />);

    expect(statLines()).toEqual([
      'Campaigns: 6',
      'Active: 2',
      `Total budget: ₹${(450000).toLocaleString()}`,
      'Sent: 2',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows loading tiles at zero until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<MarketingPage />);

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual(['Campaigns: 0', 'Active: 0', 'Total budget: ₹0', 'Sent: 0']);
  });

  it('drives the server grid with the paged campaigns query and dates through settings', () => {
    renderWithProviders(<MarketingPage />);
    const page = { totalCount: 1, rows: [campaignRow()] };

    expect(paged.document).toBe(ListCampaignsPagedDocument);
    expect(paged.select?.({ listCampaignsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(CAMPAIGN_COLUMNS);
    expect(typeof dashboardProps().context.formatDate).toBe('function');
    expect(dashboardProps()).toMatchObject({ title: 'Marketing', entityLabel: 'campaign' });
  });

  it('opens the details drawer for a campaign and closes it', async () => {
    renderWithProviders(<MarketingPage />);

    act(() => {
      dashboardProps().context.actions.view(campaignRow({ name: 'Spring sale' }));
    });
    expect(await screen.findByText('Details of Spring sale')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Campaign details' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByText('Details of Spring sale')).not.toBeInTheDocument(),
    );
  });

  it('opens the send drawer and closes it on cancel without reloading', async () => {
    renderWithProviders(<MarketingPage />);

    act(() => {
      dashboardProps().context.actions.send(campaignRow({ id: 'campaign-4' }));
    });
    expect(await screen.findByText(/"id":"campaign-4"/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Send campaign' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await waitFor(() => expect(screen.queryByText(/"id":"campaign-4"/)).not.toBeInTheDocument());
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('reloads the stats and closes the drawer once a send is done', async () => {
    renderWithProviders(<MarketingPage />);

    act(() => {
      dashboardProps().context.actions.send(campaignRow({ id: 'campaign-4' }));
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Finish form' }));

    await waitFor(() => expect(screen.queryByText(/"id":"campaign-4"/)).not.toBeInTheDocument());
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('opens a blank campaign form and edits a row from the grid', async () => {
    renderWithProviders(<MarketingPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', campaignRow({ name: 'Year end' }));
    expect(screen.getByText(/"name":"Year end"/)).toBeInTheDocument();
  });

  it('deletes a campaign after confirming, by its id', async () => {
    renderWithProviders(<MarketingPage />);

    await confirmRowDelete(campaignRow({ id: 'campaign-7' }), 'Delete campaign "Diwali offer"?');

    expect(gql.deleteCampaign).toHaveBeenCalledWith({ variables: { id: 'campaign-7' } });
    expect(await screen.findByText('Campaign deleted')).toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});

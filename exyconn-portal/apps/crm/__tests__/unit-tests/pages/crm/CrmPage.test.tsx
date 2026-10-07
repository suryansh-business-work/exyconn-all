import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListLeadsPagedDocument } from '@exyconn/shell/graphql/generated';
import { CrmPage } from '../../../../src/pages/crm';
import { LEAD_COLUMNS } from '../../../../src/pages/crm/leads-grid';
import { renderWithProviders } from '../../test-utils';
import { leadRow, pending, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../crud-dashboard-stub';
import { confirmRowDelete, runRowAction, statLines } from '../../crud-page-helpers';
import { UrlProbe } from '../../form-stub';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteLead: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListLeadsStatsQuery: () => gql.stats(),
  useDeleteLeadMutation: () => [gql.deleteLead],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/crm/forms/lead', async () => ({
  LeadForm: (await import('../../form-stub')).FormStub,
}));

vi.mock('../../../../src/pages/crm/forms/convert-lead', async () => ({
  ConvertLeadForm: (await import('../../form-stub')).FormStub,
}));

const renderPage = () =>
  renderWithProviders(
    <>
      <CrmPage />
      <UrlProbe />
    </>,
    { route: '/crm/leads' },
  );

describe('CrmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteLead.mockResolvedValue({ data: { deleteLead: true } });
    gql.stats.mockReturnValue({
      data: {
        listLeadsStats: tableStats(14, { stage: { WON: 4, LOST: 2 } }, { value: 1500000 }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('sums the pipeline and counts won and lost leads', () => {
    renderPage();

    expect(statLines()).toEqual([
      'Leads: 14',
      `Pipeline: ₹${(1500000).toLocaleString()}`,
      'Won: 4',
      'Lost: 2',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderPage();

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()).toEqual(['Leads: 0', 'Pipeline: ₹0', 'Won: 0', 'Lost: 0']);
  });

  it('drives the server grid with the paged leads query and the lead columns', () => {
    renderPage();
    const page = { totalCount: 1, rows: [leadRow()] };

    expect(paged.document).toBe(ListLeadsPagedDocument);
    expect(paged.select?.({ listLeadsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(LEAD_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'CRM', exportFileName: 'leads' });
  });

  it('opens the lead form blank for a new lead and with the row for an edit', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', leadRow({ name: 'Meera Iyer' }));
    expect(screen.getByText(/"name":"Meera Iyer"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a lead after confirming, by its id', async () => {
    renderPage();

    await confirmRowDelete(leadRow({ id: 'lead-5' }), 'Delete lead "Asha Rao"?');

    expect(gql.deleteLead).toHaveBeenCalledWith({ variables: { id: 'lead-5' } });
    expect(await screen.findByText('Lead deleted')).toBeInTheDocument();
  });

  it('opens the convert panel for a lead and closes it on cancel', async () => {
    renderPage();

    await runRowAction('convert', leadRow({ id: 'lead-8', name: 'Kiran Shah' }));
    expect(await screen.findByRole('heading', { name: 'Convert lead' })).toBeInTheDocument();
    expect(screen.getByText(/"id":"lead-8"/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await waitFor(() => expect(screen.queryByText(/"id":"lead-8"/)).not.toBeInTheDocument());
    expect(screen.getByLabelText('current url')).toHaveTextContent('/crm/leads');
  });

  it('closes the convert panel from its close button', async () => {
    renderPage();

    await runRowAction('convert', leadRow({ id: 'lead-8' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText(/"id":"lead-8"/)).not.toBeInTheDocument());
  });

  it('takes the user to the deals board once the lead is converted', async () => {
    renderPage();

    await runRowAction('convert', leadRow({ id: 'lead-8' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Finish form' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent('/crm/deals');
    expect(screen.queryByText(/"id":"lead-8"/)).not.toBeInTheDocument();
  });
});

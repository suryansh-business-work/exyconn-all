import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItDecision, ListItPurchaseRequestsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ProcurementPage } from '../../../../src/pages/procurement';
import { PROCUREMENT_COLUMNS } from '../../../../src/pages/procurement/procurement-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, purchaseRow, tableStats } from '../page-kit/fixtures';
import { dashboardProps, paged } from '../page-kit/crud-dashboard.stub';
import { answerRowConfirm, runRowAction, statLines } from '../page-kit/page-actions';
import { decisionDialog } from './decision-dialog.stub';

const gql = vi.hoisted(() => ({
  stats: vi.fn(),
  refetch: vi.fn(),
  remove: vi.fn(),
  decide: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListItPurchaseRequestsStatsQuery: () => gql.stats(),
  useDeleteItPurchaseRequestMutation: () => [gql.remove],
  useDecideItPurchaseRequestMutation: () => [gql.decide],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../page-kit/crud-dashboard.stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../page-kit/settings.mock')).settingsModule,
);

vi.mock('../../../../src/components/decision', async () => ({
  DecisionDialog: (await import('./decision-dialog.stub')).DecisionDialogStub,
}));

vi.mock('../../../../src/pages/procurement/forms/purchase-request', async () => ({
  PurchaseRequestForm: (await import('../page-kit/form.stub')).FormStub,
}));

describe('ProcurementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.remove.mockResolvedValue({ data: { deleteItPurchaseRequest: true } });
    gql.decide.mockResolvedValue({ data: { decideItPurchaseRequest: { id: 'purchase-1' } } });
    const stats = tableStats(
      10,
      { status: { REQUESTED: 3, QUOTED: 2, ORDERED: 4, RECEIVED: 1 } },
      { estimatedCost: 48000 },
    );
    gql.stats.mockReturnValue({
      data: { listItPurchaseRequestsStats: stats },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts requests, those awaiting approval, those on order and the estimated spend', () => {
    renderWithProviders(<ProcurementPage />);

    expect(statLines()).toEqual([
      'Requests: 10',
      'Awaiting approval: 5',
      'On order: 4',
      'Estimated total: money(48000)',
    ]);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('shows zeros while the stats load', () => {
    gql.stats.mockReturnValue(pending());
    renderWithProviders(<ProcurementPage />);

    expect(statLines()).toEqual([
      'Requests: 0',
      'Awaiting approval: 0',
      'On order: 0',
      'Estimated total: money(0)',
    ]);
    expect(dashboardProps().statsLoading).toBe(true);
  });

  it('drives the server grid with the paged procurement query', () => {
    renderWithProviders(<ProcurementPage />);
    const page = { totalCount: 1, rows: [purchaseRow()] };

    expect(paged.document).toBe(ListItPurchaseRequestsPagedDocument);
    expect(paged.select?.({ listItPurchaseRequestsPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      title: 'Procurement',
      exportFileName: 'it-procurement',
      permissionModule: 'ItPurchaseRequest',
      columnDefs: PROCUREMENT_COLUMNS,
    });
    expect(dashboardProps().context.formatDate?.('2026-10-01')).toBe('date(2026-10-01)');
  });

  it('opens the form blank or with the row, and reloads the stats after a save', async () => {
    renderWithProviders(<ProcurementPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', purchaseRow({ title: 'Monitors' }));
    expect(screen.getByText(/"title":"Monitors"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(screen.queryByText(/Monitors/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the decision drawer closed until a request is picked', () => {
    renderWithProviders(<ProcurementPage />);

    expect(decisionDialog.props?.title).toBeNull();
    expect(screen.queryByRole('region', { name: 'decision' })).not.toBeInTheDocument();
  });

  it('records a decision against the picked request and reloads', async () => {
    renderWithProviders(<ProcurementPage />);

    await runRowAction('decide', purchaseRow({ id: 'purchase-5', title: 'Docking stations' }));
    expect(screen.getByText('Deciding Docking stations')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reject it' }));
    await act(async () => {
      await decisionDialog.lastDecision;
    });

    expect(gql.decide).toHaveBeenCalledWith({
      variables: { id: 'purchase-5', decision: ItDecision.Rejected, note: 'Too expensive' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Decision recorded' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('closes the drawer, after which a stray decision names no request', async () => {
    renderWithProviders(<ProcurementPage />);

    await runRowAction('decide', purchaseRow());
    await userEvent.click(screen.getByRole('button', { name: 'Close decision' }));

    expect(screen.queryByText(/Deciding/)).not.toBeInTheDocument();
    await act(async () => {
      await decisionDialog.props?.onDecide({ decision: ItDecision.Approved, note: '' });
    });
    expect(gql.decide).toHaveBeenCalledWith({
      variables: { id: '', decision: ItDecision.Approved, note: '' },
    });
  });

  it('deletes a request by id once confirmed', async () => {
    renderWithProviders(<ProcurementPage />);

    await answerRowConfirm(
      'delete',
      purchaseRow({ id: 'purchase-8' }),
      'Delete "Laptops"?',
      'Delete',
    );

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'purchase-8' } });
    expect(await screen.findByText('Purchase request deleted')).toBeInTheDocument();
  });
});

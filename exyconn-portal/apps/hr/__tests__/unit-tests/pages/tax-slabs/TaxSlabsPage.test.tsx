import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListTaxSlabsPagedDocument } from '@exyconn/shell/graphql/generated';
import { TaxSlabsPage } from '../../../../src/pages/tax-slabs';
import { TAX_SLAB_COLUMNS } from '../../../../src/pages/tax-slabs/tax-slab-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps, paged } from '../../harness/crud-dashboard';
import { answerRowDelete, statLines, tableStats } from '../../harness/crud-page';
import { REGIMES, captured, type SlabFormProps } from './tax-slabs.fixtures';

const gql = vi.hoisted(() => ({
  regimes: vi.fn(),
  regimesRefetch: vi.fn(),
  stats: vi.fn(),
  statsRefetch: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListTaxRegimesQuery: (options: unknown) => gql.regimes(options),
  useListTaxSlabsStatsQuery: () => gql.stats(),
  useDeleteTaxSlabMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/tax-slabs/forms/tax-slab', async () => ({
  TaxSlabForm: (await import('./tax-slabs.fixtures')).SlabFormStub,
}));

vi.mock('../../../../src/pages/tax-slabs/TaxRegimePanel', async () => ({
  TaxRegimePanel: (await import('./tax-slabs.fixtures')).RegimePanelStub,
}));

const regimesAnswer = (list: typeof REGIMES, loading = false) => ({
  data: { listTaxRegimes: list },
  loading,
  refetch: gql.regimesRefetch,
});

const slabForm = (): SlabFormProps => {
  if (!captured.slabForm) {
    throw new Error('TaxSlabForm was not rendered');
  }
  return captured.slabForm;
};

describe('TaxSlabsPage', () => {
  beforeEach(() => {
    captured.slabForm = null;
    captured.panel = null;
    gql.regimesRefetch.mockReset().mockResolvedValue({});
    gql.statsRefetch.mockReset().mockResolvedValue({});
    gql.remove.mockReset().mockResolvedValue({ data: {} });
    gql.regimes.mockReset().mockReturnValue(regimesAnswer(REGIMES));
    gql.stats.mockReset().mockReturnValue({
      data: { listTaxSlabsStats: tableStats(9, { active: { true: 7, false: 2 } }) },
      loading: false,
      refetch: gql.statsRefetch,
    });
  });

  it('counts the bands from the stats and the regimes from their own list', () => {
    renderWithProviders(<TaxSlabsPage />);

    expect(statLines()).toEqual(['Bands: 9', 'Applied: 7', 'Retired: 2', 'Regimes: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
    expect(gql.regimes).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('marks the tiles loading, at zero, before anything has answered', () => {
    gql.regimes.mockReturnValue({ data: undefined, loading: true, refetch: gql.regimesRefetch });
    gql.stats.mockReturnValue({ data: undefined, loading: true, refetch: gql.statsRefetch });
    renderWithProviders(<TaxSlabsPage />);

    expect(statLines()).toEqual(['Bands: 0', 'Applied: 0', 'Retired: 0', 'Regimes: 0']);
    expect(dashboardProps().statsLoading).toBe(true);
    expect(captured.panel).toMatchObject({ regimes: [], loading: true });
  });

  it('drives the server grid with the paged bands and only the row actions', () => {
    renderWithProviders(<TaxSlabsPage />);
    const page = { totalCount: 1, rows: [{ id: 'slab-1' }] };

    expect(paged.document).toBe(ListTaxSlabsPagedDocument);
    expect(paged.select?.({ listTaxSlabsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(TAX_SLAB_COLUMNS);
    expect(dashboardProps()).toMatchObject({
      title: 'Tax Slabs',
      exportFileName: 'tax-slabs',
      entityLabel: 'band',
      searchPlaceholder: 'Search bands by regime or year…',
    });
    expect(Object.keys(dashboardProps().context.actions)).toEqual(['edit', 'delete']);
  });

  it('files a new band under the applied regime and offers every regime by name and year', async () => {
    renderWithProviders(<TaxSlabsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));

    expect(slabForm()).toMatchObject({
      initial: null,
      defaultRegimeKey: 'NEW',
      defaultFinancialYear: '2026-27',
      regimeOptions: [
        { value: 'OLD', label: 'Old regime (2025-26)' },
        { value: 'NEW', label: 'New regime (2026-27)' },
      ],
    });
  });

  it('falls back to the first regime when none is applied, and to nothing with none on file', async () => {
    gql.regimes.mockReturnValue(regimesAnswer([REGIMES[0]]));
    const { unmount } = renderWithProviders(<TaxSlabsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(slabForm()).toMatchObject({ defaultRegimeKey: 'OLD', defaultFinancialYear: '2025-26' });
    unmount();

    gql.regimes.mockReturnValue(regimesAnswer([]));
    renderWithProviders(<TaxSlabsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(slabForm()).toMatchObject({
      defaultRegimeKey: '',
      defaultFinancialYear: '',
      regimeOptions: [],
    });
  });

  it('closes the form on cancel and reloads the bands once it is saved', async () => {
    renderWithProviders(<TaxSlabsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel band' }));
    expect(screen.queryByText('Band form')).not.toBeInTheDocument();
    expect(gql.statsRefetch).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save band' }));
    expect(screen.queryByText('Band form')).not.toBeInTheDocument();
    expect(gql.statsRefetch).toHaveBeenCalledTimes(1);
  });

  it('names the rate and the regime when asking to delete a band', async () => {
    renderWithProviders(<TaxSlabsPage />);

    await answerRowDelete(
      { id: 'slab-4', ratePercent: 20, regimeKey: 'NEW' },
      'Delete the 20% band of NEW?',
    );

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'slab-4' } });
    expect(await screen.findByText('Tax slab deleted')).toBeInTheDocument();
    expect(gql.statsRefetch).toHaveBeenCalledTimes(1);
  });

  it('puts the regimes above the bands and re-reads them when the panel asks', async () => {
    renderWithProviders(<TaxSlabsPage />);

    expect(captured.panel).toMatchObject({ regimes: REGIMES, loading: false });
    await userEvent.click(screen.getByRole('button', { name: 'Reload regimes' }));
    expect(gql.regimesRefetch).toHaveBeenCalledTimes(1);
  });
});

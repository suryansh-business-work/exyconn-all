import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import {
  useListTaxRegimesQuery,
  useListTaxSlabsStatsQuery,
  useDeleteTaxSlabMutation,
  ListTaxSlabsPagedDocument,
  type ListTaxSlabsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { TaxRegimePanel } from './TaxRegimePanel';
import { TaxSlabForm, type TaxSlabRow } from './forms/tax-slab';
import { TAX_SLAB_COLUMNS, type PagedTaxSlabRow, type TaxSlabGridContext } from './tax-slab-grid';
import { color } from '@exyconn/shell/components/ui';

const ACCENT = color.amber[500];

/**
 * HR › Tax Slabs — the income-tax bands SLAB mode walks, and the regimes they belong to.
 *
 * A page of its own rather than a section of Payroll Settings: the bands are a table with
 * rows to add, retire and reorder, which is a grid, and the settings screen is a form.
 * Payroll Settings still owns the choice of WHICH regime a run applies.
 */
export function TaxSlabsPage() {
  const regimesQuery = useListTaxRegimesQuery({ fetchPolicy: 'cache-and-network' });
  const { data: statsData, refetch: refetchStats } = useListTaxSlabsStatsQuery();
  const [deleteSlab] = useDeleteTaxSlabMutation();

  const crud = useCrudResource<TaxSlabRow, PagedTaxSlabRow>({
    label: 'Tax slab',
    onDelete: (row) => deleteSlab({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete the ${row.ratePercent}% band of ${row.regimeKey}?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListTaxSlabsPagedDocument,
    (data: ListTaxSlabsPagedQuery) => data.listTaxSlabsPaged,
  );

  const regimes = regimesQuery.data?.listTaxRegimes ?? [];
  const applied = regimes.filter((regime) => regime.active);
  const regimeOptions: SelectOption[] = regimes.map((regime) => ({
    value: regime.regimeKey,
    label: `${regime.name} (${regime.financialYear})`,
  }));
  const newest = applied[0] ?? regimes[0];

  const stats = statsData?.listTaxSlabsStats;
  const statItems: StatItem[] = [
    { label: 'Bands', value: String(statTotal(stats)), accent: ACCENT },
    { label: 'Applied', value: String(statCount(stats, 'active', 'true')), accent: ACCENT },
    { label: 'Retired', value: String(statCount(stats, 'active', 'false')), accent: ACCENT },
    { label: 'Regimes', value: String(regimes.length), accent: ACCENT },
  ];

  const gridContext: TaxSlabGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  const reloadRegimes = () => regimesQuery.refetch();

  return (
    <CrudDashboard
      title="Tax Slabs"
      subtitle="Income-tax regimes and the bands every payslip is worked out from"
      entityLabel="band"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <TaxSlabForm
          initial={initial}
          regimeOptions={regimeOptions}
          defaultRegimeKey={newest?.regimeKey ?? ''}
          defaultFinancialYear={newest?.financialYear ?? ''}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      )}
      columnDefs={TAX_SLAB_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search bands by regime or year…"
      toolbar={
        <TaxRegimePanel regimes={regimes} loading={regimesQuery.loading} refetch={reloadRegimes} />
      }
      permissionModule="TaxSlab"
    />
  );
}

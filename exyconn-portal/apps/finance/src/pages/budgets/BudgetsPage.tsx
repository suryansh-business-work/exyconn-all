import { useMemo } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';
import {
  useListBudgetsStatsQuery,
  useListCostCentersQuery,
  useDeleteBudgetMutation,
  ListBudgetsPagedDocument,
  type ListBudgetsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { BudgetForm, type BudgetRow } from './forms/budget';
import { budgetColumns, type PagedBudgetRow, type BudgetsGridContext } from './budgets-grid';

/** Finance → Budgets: what each cost centre may spend, one month at a time. */
export function BudgetsPage() {
  const { data: statsData, refetch: refetchStats } = useListBudgetsStatsQuery();
  const { data: centresData } = useListCostCentersQuery();
  const [deleteBudget] = useDeleteBudgetMutation();

  const centres = useMemo(() => centresData?.listCostCenters ?? [], [centresData]);
  // Only active centres can take a NEW budget; the names map still covers retired ones so an
  // existing row never renders as a bare id.
  const options = useMemo(
    () =>
      centres
        .filter((centre) => centre.isActive)
        .map((centre) => ({ value: centre.id, label: `${centre.code} — ${centre.name}` })),
    [centres],
  );
  const nameOf = useMemo(() => {
    const byId = new Map(centres.map((centre) => [centre.id, centre.code]));
    return (id: string) => byId.get(id) ?? '—';
  }, [centres]);

  const crud = useCrudResource<BudgetRow, PagedBudgetRow>({
    label: 'Budget',
    onDelete: (row) => deleteBudget({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete the ${row.month} budget for ${nameOf(row.costCenterId)}?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListBudgetsPagedDocument,
    (data: ListBudgetsPagedQuery) => data.listBudgetsPaged,
  );

  const stats = statsData?.listBudgetsStats;
  const statItems: StatItem[] = [
    { label: 'Budgets', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Total budgeted', value: formatMoney(statSum(stats, 'amount')), accent: '#8b5cf6' },
    { label: 'Cost centres', value: String(options.length), accent: '#22c55e' },
  ];

  const gridContext: BudgetsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Budgets"
      subtitle="What each cost centre may spend, month by month"
      entityLabel="budget"
      exportFileName="budgets"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <BudgetForm
          initial={initial}
          costCentres={options}
          onCancel={crud.close}
          onDone={crud.onDone}
        />
      )}
      permissionModule="Budget"
      columnDefs={budgetColumns(nameOf)}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by month or note…"
    />
  );
}

import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { formatMoney } from '@exyconn/shell/utils/money';
import {
  useListDealsStatsQuery,
  useDeleteDealMutation,
  ListDealsPagedDocument,
  type ListDealsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { DealForm, type DealRow } from './forms/deal';
import { DEAL_COLUMNS, type PagedDealRow, type DealsGridContext } from './deals-grid';
import { DealsViewToggle } from './DealsViewToggle';

/**
 * CRM → Deals → List: the same opportunities as the board, as a sortable, filterable
 * register. The board is for moving a deal; this is for finding one.
 */
export function DealsListPage() {
  const { data: statsData, refetch: refetchStats } = useListDealsStatsQuery();
  const [deleteDeal] = useDeleteDealMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<DealRow, PagedDealRow>({
    label: 'Deal',
    onDelete: (row) => deleteDeal({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete deal "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListDealsPagedDocument,
    (data: ListDealsPagedQuery) => data.listDealsPaged,
  );

  const stats = statsData?.listDealsStats;
  const statItems: StatItem[] = [
    { label: 'Deals', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Total value', value: formatMoney(statSum(stats, 'value')), accent: '#f59e0b' },
    { label: 'Won', value: String(statCount(stats, 'stage', 'WON')), accent: '#22c55e' },
    { label: 'Lost', value: String(statCount(stats, 'stage', 'LOST')), accent: '#ff6b6b' },
  ];

  const gridContext: DealsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <>
      <DealsViewToggle />
      <CrudDashboard
        title="Deals"
        subtitle="Every opportunity, as a register"
        entityLabel="deal"
        stats={statItems}
        crud={crud}
        renderForm={(initial) => (
          <DealForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
        )}
        columnDefs={DEAL_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        searchPlaceholder="Search deals…"
      />
    </>
  );
}

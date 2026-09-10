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
import { useCreateInvoiceFromDeal } from './useCreateInvoiceFromDeal';
import { color } from '@exyconn/shell/components/ui';

/**
 * CRM → Deals → List: the same opportunities as the board, as a sortable, filterable
 * register. The board is for moving a deal; this is for finding one.
 */
export function DealsListPage() {
  const { data: statsData, refetch: refetchStats } = useListDealsStatsQuery();
  const [deleteDeal] = useDeleteDealMutation();
  const { formatDate } = useSettings();
  const createInvoice = useCreateInvoiceFromDeal();
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
    { label: 'Deals', value: String(statTotal(stats)), accent: color.blue[400] },
    { label: 'Total value', value: formatMoney(statSum(stats, 'value')), accent: color.amber[500] },
    { label: 'Won', value: String(statCount(stats, 'stage', 'WON')), accent: color.green[500] },
    { label: 'Lost', value: String(statCount(stats, 'stage', 'LOST')), accent: color.red[200] },
  ];

  const gridContext: DealsGridContext = {
    actions: { createInvoice, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <>
      <DealsViewToggle />
      <CrudDashboard
        title="Deals"
        subtitle="Every opportunity, as a register"
        entityLabel="deal"
        exportFileName="deals"
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

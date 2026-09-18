import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListItPurchaseRequestsPagedDocument,
  useDecideItPurchaseRequestMutation,
  useDeleteItPurchaseRequestMutation,
  useListItPurchaseRequestsStatsQuery,
  type ListItPurchaseRequestsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { DecisionDialog, type DecisionValues } from '../../components/decision';
import { PurchaseRequestForm, type PurchaseRequestRow } from './forms/purchase-request';
import {
  PROCUREMENT_COLUMNS,
  type PagedPurchaseRow,
  type ProcurementGridContext,
} from './procurement-grid';

/**
 * IT › Procurement: hardware, software and service purchases from the ask, through quotes
 * and approval, to delivery. Received hardware then goes into the asset register.
 */
export function ProcurementPage() {
  const { formatDate, formatCurrency } = useSettings();
  const [deciding, setDeciding] = useState<PagedPurchaseRow | null>(null);
  const { data: statsData, refetch: refetchStats } = useListItPurchaseRequestsStatsQuery();
  const [remove] = useDeleteItPurchaseRequestMutation();
  const [decide] = useDecideItPurchaseRequestMutation();
  const crud = useCrudResource<PurchaseRequestRow, PagedPurchaseRow>({
    label: 'Purchase request',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete "{title}"?', values: { title: row.title } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItPurchaseRequestsPagedDocument,
    (data: ListItPurchaseRequestsPagedQuery) => data.listItPurchaseRequestsPaged,
  );

  const stats = statsData?.listItPurchaseRequestsStats;
  const awaiting = statCount(stats, 'status', 'REQUESTED') + statCount(stats, 'status', 'QUOTED');
  const statItems: StatItem[] = [
    { label: 'Requests', value: String(statTotal(stats)), accent: color.cyan[600] },
    { label: 'Awaiting approval', value: String(awaiting), accent: color.amber[500] },
    {
      label: 'On order',
      value: String(statCount(stats, 'status', 'ORDERED')),
      accent: color.blue[400],
    },
    {
      label: 'Estimated total',
      value: formatCurrency(statSum(stats, 'estimatedCost')),
      accent: color.violet[400],
    },
  ];

  const gridContext: ProcurementGridContext = {
    actions: { decide: setDeciding, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  const onDecide = ({ decision, note }: DecisionValues) =>
    decide({ variables: { id: deciding?.id ?? '', decision, note } });

  return (
    <CrudDashboard
      title="Procurement"
      subtitle="Hardware and software requests, quotes, approval and purchase tracking"
      entityLabel="purchase request"
      exportFileName="it-procurement"
      permissionModule="ItPurchaseRequest"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <PurchaseRequestForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={PROCUREMENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by item, justification or order reference…"
      extraDialogs={
        <DecisionDialog
          title={deciding?.title ?? null}
          onDecide={onDecide}
          onClose={() => setDeciding(null)}
          onDecided={crud.reload}
        />
      }
    />
  );
}

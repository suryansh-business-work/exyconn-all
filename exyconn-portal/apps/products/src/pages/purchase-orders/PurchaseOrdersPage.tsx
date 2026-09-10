import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListPurchaseOrdersPagedDocument,
  useDeletePurchaseOrderMutation,
  useListPurchaseOrdersStatsQuery,
  type ListPurchaseOrdersPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { PurchaseOrderForm } from './forms/purchase-order';
import { ReceiveOrderForm } from './ReceiveOrderForm';
import { color } from '@exyconn/shell/components/ui';
import {
  PURCHASE_ORDER_COLUMNS,
  type PurchaseOrderRow,
  type PurchaseOrdersGridContext,
} from './purchase-orders-grid';

/**
 * Products → Purchase orders: what we have ordered, and what has turned up.
 *
 * Booking goods in from here is the only way received stock gains a cost, which is what lets
 * inventory be valued at what it cost rather than at what we hope to sell it for.
 */
export function PurchaseOrdersPage() {
  const { formatDate } = useSettings();
  const [receiving, setReceiving] = useState<PurchaseOrderRow | null>(null);
  const { data: statsData, refetch: refetchStats } = useListPurchaseOrdersStatsQuery();
  const [deleteOrder] = useDeletePurchaseOrderMutation();

  const crud = useCrudResource<PurchaseOrderRow, PurchaseOrderRow>({
    label: 'Purchase order',
    onDelete: (row) => deleteOrder({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete ${row.number}? Stock already received stays where it is.`,
    refetch: refetchStats,
  });

  const fetchRows = usePagedFetcher(
    ListPurchaseOrdersPagedDocument,
    (data: ListPurchaseOrdersPagedQuery) => data.listPurchaseOrdersPaged,
  );

  const stats = statsData?.listPurchaseOrdersStats;
  const statItems: StatItem[] = [
    { label: 'Orders', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Ordered',
      value: String(statCount(stats, 'status', 'ORDERED')),
      accent: color.orange[500],
    },
    {
      label: 'Part received',
      value: String(statCount(stats, 'status', 'PARTIALLY_RECEIVED')),
      accent: color.amber[600],
    },
    {
      label: 'Received',
      value: String(statCount(stats, 'status', 'RECEIVED')),
      accent: color.green[300],
    },
  ];

  const gridContext: PurchaseOrdersGridContext = {
    actions: {
      receive: setReceiving,
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  const closeReceive = () => setReceiving(null);

  return (
    <CrudDashboard
      title="Purchase orders"
      subtitle="What we ordered, what arrived, and what it cost"
      entityLabel="purchase order"
      exportFileName="purchase-orders"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <PurchaseOrderForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="PurchaseOrder"
      columnDefs={PURCHASE_ORDER_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search purchase orders…"
      extraDialogs={
        <CrudDialog open={Boolean(receiving)} title="Book stock in" onClose={closeReceive}>
          {receiving && (
            <ReceiveOrderForm
              order={receiving}
              onCancel={closeReceive}
              onDone={() => {
                crud.reload();
                closeReceive();
              }}
            />
          )}
        </CrudDialog>
      }
    />
  );
}

import { useState } from 'react';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListWebhookDeliveriesPagedDocument,
  useListWebhookDeliveriesStatsQuery,
  type ListWebhookDeliveriesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { DELIVERY_COLUMNS, type DeliveriesGridContext, type DeliveryRow } from './deliveries-grid';
import { DeliveryDialog } from './DeliveryDialog';

/**
 * Developers › Delivery log: every attempt to post an event to an endpoint, newest first —
 * the answer to "did you send it, and what did they say".
 */
export function DeliveriesPage() {
  const { formatDate } = useSettings();
  const [open, setOpen] = useState<DeliveryRow | null>(null);
  const { data, loading } = useListWebhookDeliveriesStatsQuery();
  const fetchRows = usePagedFetcher(
    ListWebhookDeliveriesPagedDocument,
    (result: ListWebhookDeliveriesPagedQuery) => result.listWebhookDeliveriesPaged,
  );

  const stats = data?.listWebhookDeliveriesStats;
  const statItems: StatItem[] = [
    { label: 'Deliveries', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Delivered',
      value: String(statCount(stats, 'status', 'DELIVERED')),
      accent: color.green[500],
    },
    {
      label: 'Retrying',
      value: String(statCount(stats, 'status', 'PENDING') + statCount(stats, 'status', 'FAILED')),
      accent: color.amber[500],
    },
    {
      label: 'Given up',
      value: String(statCount(stats, 'status', 'DEAD')),
      accent: color.red[200],
    },
  ];

  const context: DeliveriesGridContext = { actions: { view: setOpen }, formatDate };

  return (
    <CrudDashboard
      title="Delivery log"
      subtitle="Every attempt to post an event to an endpoint, with the receiver's answer"
      entityLabel="delivery"
      exportFileName="webhook-deliveries"
      stats={statItems}
      statsLoading={!data && loading}
      columnDefs={DELIVERY_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      searchPlaceholder="Search by event, status or error…"
      onRowClick={setOpen}
      extraDialogs={<DeliveryDialog delivery={open} onClose={() => setOpen(null)} />}
    />
  );
}

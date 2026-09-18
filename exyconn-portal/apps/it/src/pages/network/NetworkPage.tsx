import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import {
  ListItNetworkItemsPagedDocument,
  useDeleteItNetworkItemMutation,
  useListItNetworkItemsStatsQuery,
  type ListItNetworkItemsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { NetworkItemForm, type NetworkItemRow } from './forms/network-item';
import { NETWORK_COLUMNS, type NetworkGridContext, type PagedNetworkItemRow } from './network-grid';

/** IT › Network: Wi-Fi, VPN, firewalls, DNS and IP ranges, and whether each is up. */
export function NetworkPage() {
  const { data: statsData, refetch: refetchStats } = useListItNetworkItemsStatsQuery();
  const [remove] = useDeleteItNetworkItemMutation();
  const crud = useCrudResource<NetworkItemRow, PagedNetworkItemRow>({
    label: 'Network item',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete "{name}"?', values: { name: row.name } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItNetworkItemsPagedDocument,
    (data: ListItNetworkItemsPagedQuery) => data.listItNetworkItemsPaged,
  );

  const stats = statsData?.listItNetworkItemsStats;
  const statItems: StatItem[] = [
    { label: 'Network items', value: String(statTotal(stats)), accent: color.cyan[600] },
    {
      label: 'Active',
      value: String(statCount(stats, 'status', 'ACTIVE')),
      accent: color.green[500],
    },
    {
      label: 'Degraded',
      value: String(statCount(stats, 'status', 'DEGRADED')),
      accent: color.amber[500],
    },
    { label: 'Down', value: String(statCount(stats, 'status', 'DOWN')), accent: color.red[500] },
  ];

  const gridContext: NetworkGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Network"
      subtitle="Wi-Fi, VPN, firewalls, DNS and IP ranges. Network incidents live in Incidents."
      entityLabel="network item"
      exportFileName="network"
      permissionModule="ItNetworkItem"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <NetworkItemForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={NETWORK_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, address, location or provider…"
    />
  );
}

import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  statCount,
  statTotal,
  type TableStatsShape,
} from '@exyconn/shell/components/data/tableStats';
import {
  useListClientsStatsQuery,
  useDeleteClientMutation,
  ListClientsPagedDocument,
  type ListClientsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ClientForm, type ClientRow } from './forms/client';
import { CLIENT_COLUMNS, type PagedClientRow, type ClientsGridContext } from './clients-grid';
import { color } from '@exyconn/shell/components/ui';
import { ClientHubAccessDialog } from './hub-access/ClientHubAccessDialog';

/** How many countries the clients are in; clients with no country recorded are not one. */
const countryCount = (stats: TableStatsShape | undefined): number =>
  stats?.counts
    .find((entry) => entry.field === 'country')
    ?.buckets.filter((bucket) => bucket.value !== '').length ?? 0;

/** Clients module — client directory dashboard with a server-side clients grid. */
export function ClientsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useListClientsStatsQuery();
  const [deleteClient] = useDeleteClientMutation();
  const [hubAccessFor, setHubAccessFor] = useState<PagedClientRow | null>(null);
  const crud = useCrudResource<ClientRow, PagedClientRow>({
    label: 'Client',
    onDelete: (row) => deleteClient({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete client "{name}"?', values: { name: row.name } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListClientsPagedDocument,
    (data: ListClientsPagedQuery) => data.listClientsPaged,
  );

  const stats = statsData?.listClientsStats;
  const statItems: StatItem[] = [
    { label: 'Clients', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(statCount(stats, 'status', 'ACTIVE')),
      accent: color.green[300],
    },
    {
      label: 'Prospects',
      value: String(statCount(stats, 'status', 'PROSPECT')),
      accent: color.orange[500],
    },
    {
      label: 'Inactive',
      value: String(statCount(stats, 'status', 'INACTIVE')),
      accent: color.red[200],
    },
    { label: 'Countries', value: String(countryCount(stats)), accent: color.violet[400] },
  ];

  const gridContext: ClientsGridContext = {
    actions: { hubAccess: setHubAccessFor, edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      exportFileName="clients"
      title="Clients"
      subtitle="Client directory"
      entityLabel="client"
      stats={statItems}
      statsLoading={!statsData && statsLoading}
      crud={crud}
      renderForm={(initial) => (
        <ClientForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="Client"
      columnDefs={CLIENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search clients…"
      extraDialogs={
        <ClientHubAccessDialog client={hubAccessFor} onClose={() => setHubAccessFor(null)} />
      }
    />
  );
}

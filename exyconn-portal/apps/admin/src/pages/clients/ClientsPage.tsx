import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListClientsStatsQuery,
  useDeleteClientMutation,
  ListClientsPagedDocument,
  type ListClientsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ClientForm, type ClientRow } from './forms/client';
import { CLIENT_COLUMNS, type PagedClientRow, type ClientsGridContext } from './clients-grid';

/** Clients module — client directory dashboard with a server-side clients grid. */
export function ClientsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListClientsStatsQuery();
  const [deleteClient] = useDeleteClientMutation();
  const crud = useCrudResource<ClientRow, PagedClientRow>({
    label: 'Client',
    onDelete: (row) => deleteClient({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete client "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListClientsPagedDocument,
    (data: ListClientsPagedQuery) => data.listClientsPaged,
  );

  const stats = statsData?.listClientsStats;
  const statItems: StatItem[] = [
    { label: 'Clients', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#7be37b' },
    {
      label: 'Prospects',
      value: String(statCount(stats, 'status', 'PROSPECT')),
      accent: '#f9851f',
    },
    { label: 'Inactive', value: String(statCount(stats, 'status', 'INACTIVE')), accent: '#ff6b6b' },
  ];

  const gridContext: ClientsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Clients"
      subtitle="Client directory"
      entityLabel="client"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ClientForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CLIENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search clients…"
    />
  );
}

import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  useListClientsQuery,
  useDeleteClientMutation,
  ListClientsPagedDocument,
  type ListClientsPagedQuery,
  type ListClientsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { ClientForm, type ClientRow } from './forms/client';
import { CLIENT_COLUMNS, type PagedClientRow, type ClientsGridContext } from './clients-grid';

/** Clients module — client directory dashboard with a server-side clients grid. */
export function ClientsPage() {
  // Stat cards still summarise all clients; the grid itself is server-paged.
  const { data } = useListClientsQuery();
  const [deleteClient] = useDeleteClientMutation();
  const dialog = useCrudDialog<ClientRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listClients ?? [];
  const stats: StatItem[] = [
    { label: 'Clients', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.status === 'ACTIVE').length),
      accent: '#7be37b',
    },
    {
      label: 'Prospects',
      value: String(rows.filter((r) => r.status === 'PROSPECT').length),
      accent: '#f9851f',
    },
    {
      label: 'Inactive',
      value: String(rows.filter((r) => r.status === 'INACTIVE').length),
      accent: '#ff6b6b',
    },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedClientRow>> => {
      const result = await client.query<ListClientsPagedQuery, ListClientsPagedQueryVariables>({
        query: ListClientsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listClientsPaged.rows,
        totalCount: result.data.listClientsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedClientRow) => {
    const ok = await confirm({ message: `Delete client "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteClient({ variables: { id: row.id } });
    reload();
    notify('Client deleted');
  };

  const gridContext: ClientsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
  };

  return (
    <ModuleDashboard
      title="Clients"
      subtitle="Client directory"
      actionLabel="New client"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit client' : 'New client'}
          onClose={dialog.close}
        >
          <ClientForm
            initial={dialog.editing}
            onCancel={dialog.close}
            onDone={() => {
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedClientRow>
        columnDefs={CLIENT_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search clients…"
      />
    </ModuleDashboard>
  );
}

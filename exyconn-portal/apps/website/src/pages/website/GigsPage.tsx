import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListGigsQuery,
  useDeleteGigMutation,
  ListGigsPagedDocument,
  type ListGigsPagedQuery,
  type ListGigsPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { GigForm, type GigRow } from './forms/gig';
import { GIG_COLUMNS, type PagedGigRow, type GigsGridContext } from './gigs-grid';

/** Website CMS — freelance gigs published on the public site (server-side grid). */
export function GigsPage() {
  // Stat cards still summarise all gigs; the grid itself is server-paged.
  const { data } = useListGigsQuery();
  const [deleteGig] = useDeleteGigMutation();
  const dialog = useCrudDialog<GigRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listGigs ?? [];
  const categories = new Set(rows.map((r) => r.category));
  const stats: StatItem[] = [
    { label: 'Gigs', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Open',
      value: String(rows.filter((r) => r.status === 'open').length),
      accent: '#7be37b',
    },
    {
      label: 'Urgent',
      value: String(rows.filter((r) => r.isUrgent).length),
      accent: '#ff6b6b',
    },
    { label: 'Categories', value: String(categories.size), accent: '#f9851f' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedGigRow>> => {
      const result = await client.query<ListGigsPagedQuery, ListGigsPagedQueryVariables>({
        query: ListGigsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listGigsPaged.rows,
        totalCount: result.data.listGigsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedGigRow) => {
    const ok = await confirm({ message: `Delete gig ${row.title}?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteGig({ variables: { id: row.id } });
    reload();
    notify('Gig deleted');
  };

  const gridContext: GigsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    formatDate,
  };

  return (
    <ModuleDashboard
      title="Gigs"
      subtitle="Freelance gigs on the public site"
      actionLabel="New gig"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit gig' : 'New gig'}
          onClose={dialog.close}
        >
          <GigForm
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
      <ServerDataGrid<PagedGigRow>
        columnDefs={GIG_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search gigs…"
      />
    </ModuleDashboard>
  );
}

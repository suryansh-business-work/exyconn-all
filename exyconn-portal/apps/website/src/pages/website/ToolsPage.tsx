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
import {
  useListToolsQuery,
  useDeleteToolMutation,
  ListToolsPagedDocument,
  type ListToolsPagedQuery,
  type ListToolsPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { ToolForm, type ToolRow } from './forms/tool';
import { TOOL_COLUMNS, type PagedToolRow, type ToolsGridContext } from './tools-grid';

/** Website CMS — the tools listed in the public tools directory (server-side grid). */
export function ToolsPage() {
  // Stat cards still summarise all tools; the grid itself is server-paged.
  const { data } = useListToolsQuery();
  const [deleteTool] = useDeleteToolMutation();
  const dialog = useCrudDialog<ToolRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listTools ?? [];
  const categories = new Set(rows.map((r) => r.categorySlug));
  const stats: StatItem[] = [
    { label: 'Tools', value: String(rows.length), accent: '#4f8cff' },
    {
      label: 'Active',
      value: String(rows.filter((r) => r.isActive).length),
      accent: '#7be37b',
    },
    { label: 'MVP', value: String(rows.filter((r) => r.isMVP).length), accent: '#f9851f' },
    { label: 'Categories', value: String(categories.size), accent: '#b18cff' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedToolRow>> => {
      const result = await client.query<ListToolsPagedQuery, ListToolsPagedQueryVariables>({
        query: ListToolsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listToolsPaged.rows,
        totalCount: result.data.listToolsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedToolRow) => {
    const ok = await confirm({ message: `Delete tool ${row.name}?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteTool({ variables: { id: row.id } });
    reload();
    notify('Tool deleted');
  };

  const gridContext: ToolsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
  };

  return (
    <ModuleDashboard
      title="Tools"
      subtitle="The public tools directory"
      actionLabel="New tool"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit tool' : 'New tool'}
          onClose={dialog.close}
        >
          <ToolForm
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
      <ServerDataGrid<PagedToolRow>
        columnDefs={TOOL_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search tools…"
      />
    </ModuleDashboard>
  );
}

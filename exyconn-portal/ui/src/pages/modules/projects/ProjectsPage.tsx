import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import {
  useListProjectsQuery,
  useDeleteProjectMutation,
  ListProjectsPagedDocument,
  type ListProjectsPagedQuery,
  type ListProjectsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { ProjectForm, type ProjectRow } from './forms/project';
import { PROJECT_COLUMNS, type PagedProjectRow, type ProjectsGridContext } from './projects-grid';

/** Projects module — project management dashboard with a server-side projects grid. */
export function ProjectsPage() {
  // Stat cards still summarise all projects; the grid itself is server-paged.
  const { data } = useListProjectsQuery({ fetchPolicy: 'cache-and-network' });
  const [deleteProject] = useDeleteProjectMutation();
  const dialog = useCrudDialog<ProjectRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const openBoard = (row: PagedProjectRow) => navigate(`/portal/projects/${row.id}/board`);

  const rows = data?.listProjects ?? [];
  const count = (status: string) => rows.filter((r) => r.status === status).length;
  const stats: StatItem[] = [
    { label: 'Total', value: String(rows.length), accent: '#155dfc' },
    { label: 'Active', value: String(count('ACTIVE')), accent: '#22c55e' },
    { label: 'On hold', value: String(count('ON_HOLD')), accent: '#f59e0b' },
    { label: 'Completed', value: String(count('COMPLETED')), accent: '#8b5cf6' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedProjectRow>> => {
      const result = await client.query<ListProjectsPagedQuery, ListProjectsPagedQueryVariables>({
        query: ListProjectsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listProjectsPaged.rows,
        totalCount: result.data.listProjectsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedProjectRow) => {
    const ok = await confirm({ message: `Delete project "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteProject({ variables: { id: row.id } });
    reload();
    notify('Project deleted');
  };

  const gridContext: ProjectsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    onOpenBoard: openBoard,
    formatDate,
  };

  return (
    <ModuleDashboard
      title="Projects"
      subtitle="Project management"
      actionLabel="New project"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit project' : 'New project'}
          onClose={dialog.close}
        >
          <ProjectForm
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
      <ServerDataGrid<PagedProjectRow>
        columnDefs={PROJECT_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search projects…"
        onRowClick={openBoard}
      />
    </ModuleDashboard>
  );
}

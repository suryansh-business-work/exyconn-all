import { useNavigate } from 'react-router-dom';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListProjectsQuery, useDeleteProjectMutation } from '../../../graphql/generated';
import { ProjectForm, type ProjectRow } from './forms/project';

/** Projects module — project management dashboard with real counts. */
export function ProjectsPage() {
  const { data, loading, refetch } = useListProjectsQuery({ fetchPolicy: 'cache-and-network' });
  const [deleteProject] = useDeleteProjectMutation();
  const dialog = useCrudDialog<ProjectRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const openBoard = (row: ProjectRow) => navigate(`/portal/projects/${row.id}/board`);

  const rows = data?.listProjects ?? [];
  const count = (status: string) => rows.filter((r) => r.status === status).length;
  const stats: StatItem[] = [
    { label: 'Total', value: String(rows.length), accent: '#155dfc' },
    { label: 'Active', value: String(count('ACTIVE')), accent: '#22c55e' },
    { label: 'On hold', value: String(count('ON_HOLD')), accent: '#f59e0b' },
    { label: 'Completed', value: String(count('COMPLETED')), accent: '#8b5cf6' },
  ];

  const columns: Column<ProjectRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'startDate', label: 'Start', render: (r) => formatDate(r.startDate) || '—' },
    { key: 'endDate', label: 'End', render: (r) => formatDate(r.endDate) || '—' },
    { key: 'description', label: 'Description', render: (r) => r.description ?? '—' },
  ];

  const handleDelete = async (row: ProjectRow) => {
    const ok = await confirm({ message: `Delete project "${row.name}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteProject({ variables: { id: row.id } });
    await refetch();
    notify('Project deleted');
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
              void refetch();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={openBoard}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        actions={[
          {
            icon: <ViewKanbanIcon fontSize="small" />,
            tooltip: 'Open board',
            ariaLabel: 'open board',
            color: 'primary',
            onClick: openBoard,
          },
        ]}
        emptyMessage={loading ? 'Loading…' : 'No projects yet.'}
      />
    </ModuleDashboard>
  );
}

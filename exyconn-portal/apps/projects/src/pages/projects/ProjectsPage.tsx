import { useNavigate } from 'react-router-dom';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListProjectsStatsQuery,
  useDeleteProjectMutation,
  ListProjectsPagedDocument,
  type ListProjectsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ProjectForm, type ProjectRow } from './forms/project';
import { PROJECT_COLUMNS, type PagedProjectRow, type ProjectsGridContext } from './projects-grid';

/** Projects module — project management dashboard with a server-side projects grid. */
export function ProjectsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListProjectsStatsQuery();
  const [deleteProject] = useDeleteProjectMutation();
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const crud = useCrudResource<ProjectRow, PagedProjectRow>({
    label: 'Project',
    onDelete: (row) => deleteProject({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete project "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListProjectsPagedDocument,
    (data: ListProjectsPagedQuery) => data.listProjectsPaged,
  );

  const openProject = (row: PagedProjectRow) => navigate(`/projects/${row.id}/board`);

  const stats = statsData?.listProjectsStats;
  const statItems: StatItem[] = [
    { label: 'Total', value: String(statTotal(stats)), accent: '#155dfc' },
    { label: 'Active', value: String(statCount(stats, 'status', 'ACTIVE')), accent: '#22c55e' },
    { label: 'On hold', value: String(statCount(stats, 'status', 'ON_HOLD')), accent: '#f59e0b' },
    {
      label: 'Completed',
      value: String(statCount(stats, 'status', 'COMPLETED')),
      accent: '#8b5cf6',
    },
  ];

  const gridContext: ProjectsGridContext = {
    actions: { board: openProject, edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Projects"
      subtitle="Project management"
      entityLabel="project"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ProjectForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={PROJECT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search projects…"
      onRowClick={openProject}
    />
  );
}

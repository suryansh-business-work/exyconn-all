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
  useListJobsQuery,
  useDeleteJobMutation,
  ListJobsPagedDocument,
  type ListJobsPagedQuery,
  type ListJobsPagedQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { JobForm, type JobRow } from './forms/job';
import { JOB_COLUMNS, type PagedJobRow, type JobsGridContext } from './jobs-grid';

/** Website module — job postings published on the public careers site (server-side grid). */
export function JobsPage() {
  // Stat cards still summarise all jobs; the grid itself is server-paged.
  const { data } = useListJobsQuery();
  const [deleteJob] = useDeleteJobMutation();
  const dialog = useCrudDialog<JobRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listJobs ?? [];
  const companies = new Set(rows.map((r) => r.companySlug).filter(Boolean));
  const stats: StatItem[] = [
    { label: 'Jobs', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    {
      label: 'Featured',
      value: String(rows.filter((r) => r.isFeatured).length),
      accent: '#f9851f',
    },
    { label: 'Companies', value: String(companies.size), accent: '#c084fc' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedJobRow>> => {
      const result = await client.query<ListJobsPagedQuery, ListJobsPagedQueryVariables>({
        query: ListJobsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listJobsPaged.rows,
        totalCount: result.data.listJobsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedJobRow) => {
    const ok = await confirm({ message: `Delete job ${row.title}?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteJob({ variables: { id: row.id } });
    reload();
    notify('Job deleted');
  };

  const gridContext: JobsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
  };

  return (
    <ModuleDashboard
      title="Jobs"
      subtitle="Openings published on the public careers site"
      actionLabel="New job"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit job' : 'New job'}
          onClose={dialog.close}
        >
          <JobForm
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
      <ServerDataGrid<PagedJobRow>
        columnDefs={JOB_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search jobs…"
      />
    </ModuleDashboard>
  );
}

import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListJobsQuery, useDeleteJobMutation } from '../../../graphql/generated';
import { JobForm, type JobRow } from './forms/job';

/** Website module — job postings published on the public careers site. */
export function JobsPage() {
  const { data, loading, refetch } = useListJobsQuery();
  const [deleteJob] = useDeleteJobMutation();
  const dialog = useCrudDialog<JobRow>();
  const confirm = useConfirm();
  const notify = useNotify();

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

  const columns: Column<JobRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'jobCode', label: 'Code' },
    { key: 'companySlug', label: 'Company' },
    { key: 'category', label: 'Category' },
    { key: 'jobType', label: 'Type' },
    { key: 'workMode', label: 'Work mode' },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  const handleDelete = async (row: JobRow) => {
    const ok = await confirm({ message: `Delete job ${row.title}?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteJob({ variables: { id: row.id } });
    await refetch();
    notify('Job deleted');
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
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No jobs yet.'}
      />
    </ModuleDashboard>
  );
}

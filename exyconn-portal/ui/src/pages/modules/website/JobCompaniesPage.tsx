import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListJobCompaniesQuery, useDeleteJobCompanyMutation } from '../../../graphql/generated';
import { JobCompanyForm, type JobCompanyRow } from './forms/job-company';

/** Website module — job companies powering the public careers pages. */
export function JobCompaniesPage() {
  const { data, loading, refetch } = useListJobCompaniesQuery();
  const [deleteJobCompany] = useDeleteJobCompanyMutation();
  const dialog = useCrudDialog<JobCompanyRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listJobCompanies ?? [];
  const benefitCount = rows.reduce((sum, r) => sum + r.benefits.length, 0);
  const industries = new Set(rows.map((r) => r.industry).filter(Boolean));
  const stats: StatItem[] = [
    { label: 'Companies', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Benefits', value: String(benefitCount), accent: '#f9851f' },
    { label: 'Industries', value: String(industries.size), accent: '#c084fc' },
  ];

  const columns: Column<JobCompanyRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'companyCode', label: 'Code' },
    { key: 'industry', label: 'Industry' },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    { key: 'order', label: 'Order' },
  ];

  const handleDelete = async (row: JobCompanyRow) => {
    const ok = await confirm({ message: `Delete company ${row.name}?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteJobCompany({ variables: { id: row.id } });
    await refetch();
    notify('Company deleted');
  };

  return (
    <ModuleDashboard
      title="Job Companies"
      subtitle="Companies hiring through the public careers site"
      actionLabel="New company"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit company' : 'New company'}
          onClose={dialog.close}
        >
          <JobCompanyForm
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
        emptyMessage={loading ? 'Loading…' : 'No companies yet.'}
      />
    </ModuleDashboard>
  );
}

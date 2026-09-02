import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  useListJobsQuery,
  useDeleteJobMutation,
  ListJobsPagedDocument,
  type ListJobsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { JobForm, type JobRow } from './forms/job';
import { JOB_COLUMNS, type PagedJobRow, type JobsGridContext } from './jobs-grid';

/** Website module — job postings published on the public careers site (server-side grid). */
export function JobsPage() {
  // Stat cards still summarise all jobs; the grid itself is server-paged.
  const { data } = useListJobsQuery();
  const [deleteJob] = useDeleteJobMutation();
  const crud = useCrudResource<JobRow, PagedJobRow>({
    label: 'Job',
    onDelete: (row) => deleteJob({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete job ${row.title}?`,
  });
  const fetchRows = usePagedFetcher(
    ListJobsPagedDocument,
    (result: ListJobsPagedQuery) => result.listJobsPaged,
  );

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

  const gridContext: JobsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Jobs"
      subtitle="Openings published on the public careers site"
      entityLabel="job"
      stats={stats}
      crud={crud}
      renderForm={(initial) => (
        <JobForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={JOB_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search jobs…"
    />
  );
}

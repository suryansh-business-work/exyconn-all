import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import {
  useListJobCompaniesQuery,
  useDeleteJobCompanyMutation,
  ListJobCompaniesPagedDocument,
  type ListJobCompaniesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { JobCompanyForm, type JobCompanyRow } from './forms/job-company';
import {
  JOB_COMPANY_COLUMNS,
  type PagedJobCompanyRow,
  type JobCompaniesGridContext,
} from './job-companies-grid';

/** Website module — job companies powering the public careers pages (server-side grid). */
export function JobCompaniesPage() {
  // Stat cards still summarise all companies; the grid itself is server-paged.
  const { data } = useListJobCompaniesQuery();
  const [deleteJobCompany] = useDeleteJobCompanyMutation();
  const crud = useCrudResource<JobCompanyRow, PagedJobCompanyRow>({
    label: 'Company',
    onDelete: (row) => deleteJobCompany({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete company ${row.name}?`,
  });
  const fetchRows = usePagedFetcher(
    ListJobCompaniesPagedDocument,
    (result: ListJobCompaniesPagedQuery) => result.listJobCompaniesPaged,
  );

  const rows = data?.listJobCompanies ?? [];
  const benefitCount = rows.reduce((sum, r) => sum + r.benefits.length, 0);
  const industries = new Set(rows.map((r) => r.industry).filter(Boolean));
  const stats: StatItem[] = [
    { label: 'Companies', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Benefits', value: String(benefitCount), accent: '#f9851f' },
    { label: 'Industries', value: String(industries.size), accent: '#c084fc' },
  ];

  const gridContext: JobCompaniesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Job Companies"
      subtitle="Companies hiring through the public careers site"
      entityLabel="company"
      stats={stats}
      crud={crud}
      renderForm={(initial) => (
        <JobCompanyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={JOB_COMPANY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search companies…"
    />
  );
}

import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  useListJobCompaniesQuery,
  useDeleteJobCompanyMutation,
  ListJobCompaniesPagedDocument,
  type ListJobCompaniesPagedQuery,
  type ListJobCompaniesPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
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
  const dialog = useCrudDialog<JobCompanyRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listJobCompanies ?? [];
  const benefitCount = rows.reduce((sum, r) => sum + r.benefits.length, 0);
  const industries = new Set(rows.map((r) => r.industry).filter(Boolean));
  const stats: StatItem[] = [
    { label: 'Companies', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Benefits', value: String(benefitCount), accent: '#f9851f' },
    { label: 'Industries', value: String(industries.size), accent: '#c084fc' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedJobCompanyRow>> => {
      const result = await client.query<
        ListJobCompaniesPagedQuery,
        ListJobCompaniesPagedQueryVariables
      >({
        query: ListJobCompaniesPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listJobCompaniesPaged.rows,
        totalCount: result.data.listJobCompaniesPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedJobCompanyRow) => {
    const ok = await confirm({ message: `Delete company ${row.name}?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteJobCompany({ variables: { id: row.id } });
    reload();
    notify('Company deleted');
  };

  const gridContext: JobCompaniesGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
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
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedJobCompanyRow>
        columnDefs={JOB_COMPANY_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search companies…"
      />
    </ModuleDashboard>
  );
}

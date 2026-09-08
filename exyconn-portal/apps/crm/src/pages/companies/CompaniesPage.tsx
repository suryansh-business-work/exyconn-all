import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useListCompaniesStatsQuery,
  useDeleteCompanyMutation,
  usePromoteCompanyToClientMutation,
  ListCompaniesPagedDocument,
  type ListCompaniesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { CompanyForm, type CompanyRow } from './forms/company';
import { COMPANY_COLUMNS, type PagedCompanyRow, type CompaniesGridContext } from './companies-grid';

/** CRM → Companies: the accounts contacts and deals hang off. */
export function CompaniesPage() {
  const { data: statsData, refetch: refetchStats } = useListCompaniesStatsQuery();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [promoteCompany] = usePromoteCompanyToClientMutation();
  const notify = useNotify();
  const crud = useCrudResource<CompanyRow, PagedCompanyRow>({
    label: 'Company',
    onDelete: (row) => deleteCompany({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete company "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListCompaniesPagedDocument,
    (data: ListCompaniesPagedQuery) => data.listCompaniesPaged,
  );

  const stats = statsData?.listCompaniesStats;
  const statItems: StatItem[] = [
    { label: 'Companies', value: String(statTotal(stats)), accent: '#4f8cff' },
    {
      label: 'Customers',
      value: String(statCount(stats, 'status', 'CUSTOMER')),
      accent: '#22c55e',
    },
    {
      label: 'Prospects',
      value: String(statCount(stats, 'status', 'PROSPECT')),
      accent: '#f59e0b',
    },
    { label: 'Churned', value: String(statCount(stats, 'status', 'CHURNED')), accent: '#ff6b6b' },
  ];

  /** The same hand-off winning a deal does, for an account that became a customer another way. */
  const makeClient = async (row: PagedCompanyRow) => {
    try {
      await promoteCompany({ variables: { id: row.id } });
      notify(`"${row.name}" is now a client`);
      crud.reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not make the company a client'), 'error');
    }
  };

  const gridContext: CompaniesGridContext = {
    actions: { makeClient, edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Companies"
      subtitle="Accounts, and who owns them"
      entityLabel="company"
      exportFileName="companies"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <CompanyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={COMPANY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, domain, industry or owner…"
    />
  );
}

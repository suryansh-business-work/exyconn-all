import { CrudDashboard, useCrudResource } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  CrmObject,
  useListCompaniesStatsQuery,
  useDeleteCompanyMutation,
  usePromoteCompanyToClientMutation,
  SearchCompaniesDocument,
  type SearchCompaniesQuery,
} from '@exyconn/shell/graphql/generated';
import { CompanyForm, type CompanyRow } from './forms/company';
import { COMPANY_COLUMNS, type PagedCompanyRow, type CompaniesGridContext } from './companies-grid';
import { color } from '@exyconn/shell/components/ui';
import { RecordListToolbar, useRecordList, withRefreshSignal } from '../../records/list';
import { RowClickGuard } from '../../records/list/RowClickGuard';
import { RecordActions } from '../../records/RecordActions';
import { usePreviewParam } from '../../records/quick-view';
import { CompanyQuickView } from './CompanyQuickView';

/** CRM → Companies: the accounts contacts and deals hang off. */
export function CompaniesPage() {
  const { previewId, openPreview, closePreview } = usePreviewParam();
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useListCompaniesStatsQuery();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [promoteCompany] = usePromoteCompanyToClientMutation();
  const notify = useNotify();
  const crud = useCrudResource<CompanyRow, PagedCompanyRow>({
    label: 'Company',
    onDelete: (row) => deleteCompany({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete company "{name}"?', values: { name: row.name } }),
    refetch: refetchStats,
  });
  // Filters, sorts, columns and saved views: the HubSpot-style list over the search query.
  const records = useRecordList({
    object: CrmObject.Company,
    document: SearchCompaniesDocument,
    select: (data: SearchCompaniesQuery) => data.searchCompanies,
    columns: COMPANY_COLUMNS,
  });

  const stats = statsData?.listCompaniesStats;
  const statItems: StatItem[] = [
    { label: 'Companies', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Customers',
      value: String(statCount(stats, 'status', 'CUSTOMER')),
      accent: color.green[500],
    },
    {
      label: 'Prospects',
      value: String(statCount(stats, 'status', 'PROSPECT')),
      accent: color.amber[500],
    },
    {
      label: 'Churned',
      value: String(statCount(stats, 'status', 'CHURNED')),
      accent: color.red[200],
    },
  ];

  /** The same hand-off winning a deal does, for an account that became a customer another way. */
  const makeClient = async (row: PagedCompanyRow) => {
    try {
      await promoteCompany({ variables: { id: row.id } });
      notify('"{name}" is now a client', 'success', { name: row.name });
      crud.reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not make the company a client'), 'error');
    }
  };

  const gridContext: CompaniesGridContext = {
    actions: { makeClient, edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <RowClickGuard>
      <CrudDashboard
        key={records.gridKey}
        title="Companies"
        subtitle="Accounts, and who owns them"
        entityLabel="company"
        stats={statItems}
        statsLoading={!statsData && statsLoading}
        crud={withRefreshSignal(crud, records.refreshSignal)}
        renderForm={(initial) => (
          <CompanyForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
        )}
        columnDefs={records.columnDefs}
        onRowClick={(row) => openPreview(row.id)}
        fetchRows={records.fetchRows}
        bulkList="searchCompanies"
        context={gridContext}
        searchPlaceholder="Search by name, domain, industry or owner…"
        initialSearch={records.initialSearch}
        extraDialogs={
          <CompanyQuickView id={previewId} onClose={closePreview} onSaved={crud.reload} />
        }
        toolbar={
          <RecordListToolbar
            records={records}
            allLabel="All companies"
            renderActions={(query) => (
              <RecordActions
                object={CrmObject.Company}
                query={query}
                fileName="companies"
                onImported={crud.reload}
              />
            )}
          />
        }
      />
    </RowClickGuard>
  );
}

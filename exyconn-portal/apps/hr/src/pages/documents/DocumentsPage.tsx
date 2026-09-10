import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useEmployeeNames } from '../../hooks/useEmployeeNames';
import {
  useListEmployeeDocumentsStatsQuery,
  useDeleteEmployeeDocumentMutation,
  ListEmployeeDocumentsPagedDocument,
  type ListEmployeeDocumentsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { EmployeeDocumentForm, type EmployeeDocumentRow } from './forms/employee-document';
import { color } from '@exyconn/shell/components/ui';
import {
  EMPLOYEE_DOCUMENT_COLUMNS,
  type PagedEmployeeDocumentRow,
  type EmployeeDocumentGridContext,
} from './employee-document-grid';

/** Employee Documents — server-paged admin grid over the document records. */
export function DocumentsPage() {
  const { data: statsData, refetch: refetchStats } = useListEmployeeDocumentsStatsQuery();
  const [deleteEmployeeDocument] = useDeleteEmployeeDocumentMutation();
  const { formatDate } = useSettings();
  const nameOf = useEmployeeNames();

  const crud = useCrudResource<EmployeeDocumentRow, PagedEmployeeDocumentRow>({
    label: 'EmployeeDocument',
    onDelete: (row) => deleteEmployeeDocument({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this document?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListEmployeeDocumentsPagedDocument,
    (data: ListEmployeeDocumentsPagedQuery) => data.listEmployeeDocumentsPaged,
  );

  const stats = statsData?.listEmployeeDocumentsStats;
  const statItems: StatItem[] = [
    { label: 'Documents', value: String(statTotal(stats)), accent: color.teal[500] },
    {
      label: 'Offer letters',
      value: String(statCount(stats, 'kind', 'OFFER_LETTER')),
      accent: color.teal[500],
    },
    { label: 'Tax', value: String(statCount(stats, 'kind', 'TAX')), accent: color.teal[500] },
    { label: 'Policy', value: String(statCount(stats, 'kind', 'POLICY')), accent: color.teal[500] },
  ];

  const gridContext: EmployeeDocumentGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
    nameOf,
  };

  return (
    <CrudDashboard
      title="Employee Documents"
      subtitle="Letters, tax and policy documents"
      entityLabel="document"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <EmployeeDocumentForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={EMPLOYEE_DOCUMENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search documents…"
    />
  );
}

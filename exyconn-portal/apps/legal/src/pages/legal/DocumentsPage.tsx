import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListLegalDocumentsStatsQuery,
  useDeleteLegalDocumentMutation,
  ListLegalDocumentsPagedDocument,
  type ListLegalDocumentsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { DocumentForm, type LegalDocumentRow } from './forms/document';
import { color } from '@exyconn/shell/components/ui';
import {
  DOCUMENT_COLUMNS,
  type PagedLegalDocumentRow,
  type DocumentsGridContext,
} from './document-grid';

/** Legal → Documents: repository of legal documents with CRUD. */
export function DocumentsPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListLegalDocumentsStatsQuery();
  const [deleteDocument] = useDeleteLegalDocumentMutation();
  const crud = useCrudResource<LegalDocumentRow, PagedLegalDocumentRow>({
    label: 'Document',
    onDelete: (row) => deleteDocument({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete document "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListLegalDocumentsPagedDocument,
    (data: ListLegalDocumentsPagedQuery) => data.listLegalDocumentsPaged,
  );

  const stats = statsData?.listLegalDocumentsStats;
  const statItems: StatItem[] = [
    { label: 'Total', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Final',
      value: String(statCount(stats, 'status', 'FINAL')),
      accent: color.green[500],
    },
    {
      label: 'Draft',
      value: String(statCount(stats, 'status', 'DRAFT')),
      accent: color.amber[500],
    },
    {
      label: 'Archived',
      value: String(statCount(stats, 'status', 'ARCHIVED')),
      accent: color.slate[500],
    },
  ];

  const gridContext: DocumentsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Documents"
      subtitle="Legal document repository"
      entityLabel="document"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <DocumentForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      permissionModule="LegalDocument"
      columnDefs={DOCUMENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search documents…"
    />
  );
}

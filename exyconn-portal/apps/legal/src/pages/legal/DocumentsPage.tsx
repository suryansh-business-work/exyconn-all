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
    { label: 'Total', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Final', value: String(statCount(stats, 'status', 'FINAL')), accent: '#22c55e' },
    { label: 'Draft', value: String(statCount(stats, 'status', 'DRAFT')), accent: '#f59e0b' },
    { label: 'Archived', value: String(statCount(stats, 'status', 'ARCHIVED')), accent: '#64748b' },
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
      columnDefs={DOCUMENT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search documents…"
    />
  );
}

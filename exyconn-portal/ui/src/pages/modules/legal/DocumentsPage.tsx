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
  useListLegalDocumentsQuery,
  useDeleteLegalDocumentMutation,
  ListLegalDocumentsPagedDocument,
  type ListLegalDocumentsPagedQuery,
  type ListLegalDocumentsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { DocumentForm, type LegalDocumentRow } from './forms/document';
import {
  DOCUMENT_COLUMNS,
  type PagedLegalDocumentRow,
  type DocumentsGridContext,
} from './document-grid';

/** Legal → Documents: repository of legal documents with CRUD. */
export function DocumentsPage() {
  // Stat cards still summarise all documents; the grid itself is server-paged.
  const { data } = useListLegalDocumentsQuery();
  const [deleteDocument] = useDeleteLegalDocumentMutation();
  const dialog = useCrudDialog<LegalDocumentRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const rows = data?.listLegalDocuments ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const stats: StatItem[] = [
    { label: 'Total', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Final', value: String(count('FINAL')), accent: '#22c55e' },
    { label: 'Draft', value: String(count('DRAFT')), accent: '#f59e0b' },
    { label: 'Archived', value: String(count('ARCHIVED')), accent: '#64748b' },
  ];

  const reload = () => setRefreshSignal((n) => n + 1);

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedLegalDocumentRow>> => {
      const result = await client.query<
        ListLegalDocumentsPagedQuery,
        ListLegalDocumentsPagedQueryVariables
      >({
        query: ListLegalDocumentsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listLegalDocumentsPaged.rows,
        totalCount: result.data.listLegalDocumentsPaged.totalCount,
      };
    },
    [client],
  );

  const handleDelete = async (row: PagedLegalDocumentRow) => {
    const ok = await confirm({ message: `Delete document "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deleteDocument({ variables: { id: row.id } });
    reload();
    notify('Document deleted');
  };

  const gridContext: DocumentsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
  };

  return (
    <ModuleDashboard
      title="Documents"
      subtitle="Legal document repository"
      actionLabel="New document"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit document' : 'New document'}
          onClose={dialog.close}
        >
          <DocumentForm
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
      <ServerDataGrid<PagedLegalDocumentRow>
        columnDefs={DOCUMENT_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search documents…"
      />
    </ModuleDashboard>
  );
}

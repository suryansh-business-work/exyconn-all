import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListLegalDocumentsStatsQuery,
  useDeleteLegalDocumentMutation,
  ListLegalDocumentsPagedDocument,
  type ListLegalDocumentsPagedQuery,
  type ListLegalDocumentsPagedQueryVariables,
  type TableQueryInput,
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
  const dialog = useCrudDialog<LegalDocumentRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const stats = statsData?.listLegalDocumentsStats;
  const statItems: StatItem[] = [
    { label: 'Total', value: String(statTotal(stats)), accent: '#4f8cff' },
    { label: 'Final', value: String(statCount(stats, 'status', 'FINAL')), accent: '#22c55e' },
    { label: 'Draft', value: String(statCount(stats, 'status', 'DRAFT')), accent: '#f59e0b' },
    { label: 'Archived', value: String(statCount(stats, 'status', 'ARCHIVED')), accent: '#64748b' },
  ];

  const reload = () => {
    setRefreshSignal((n) => n + 1);
    void refetchStats();
  };

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
      stats={statItems}
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

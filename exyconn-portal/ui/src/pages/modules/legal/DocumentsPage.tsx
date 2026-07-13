import { Link } from '@/components/ui';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import {
  useListLegalDocumentsQuery,
  useDeleteLegalDocumentMutation,
} from '../../../graphql/generated';
import { DocumentForm, type LegalDocumentRow } from './forms/document';

/** Legal → Documents: repository of legal documents with CRUD. */
export function DocumentsPage() {
  const { data, loading, refetch } = useListLegalDocumentsQuery();
  const [deleteDocument] = useDeleteLegalDocumentMutation();
  const dialog = useCrudDialog<LegalDocumentRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listLegalDocuments ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const stats: StatItem[] = [
    { label: 'Total', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Final', value: String(count('FINAL')), accent: '#22c55e' },
    { label: 'Draft', value: String(count('DRAFT')), accent: '#f59e0b' },
    { label: 'Archived', value: String(count('ARCHIVED')), accent: '#64748b' },
  ];

  const columns: Column<LegalDocumentRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category', render: (r) => <StatusChip value={r.category} /> },
    { key: 'owner', label: 'Owner', render: (r) => r.owner ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    {
      key: 'fileUrl',
      label: 'Link',
      render: (r) =>
        r.fileUrl ? (
          <Link href={r.fileUrl} target="_blank" rel="noopener">
            Open
          </Link>
        ) : (
          '—'
        ),
    },
  ];

  const handleDelete = async (row: LegalDocumentRow) => {
    const ok = await confirm({ message: `Delete document "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteDocument({ variables: { id: row.id } });
    await refetch();
    notify('Document deleted');
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
              void refetch();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={dialog.openEdit}
        onDelete={handleDelete}
        emptyMessage={loading ? 'Loading…' : 'No documents yet.'}
      />
    </ModuleDashboard>
  );
}

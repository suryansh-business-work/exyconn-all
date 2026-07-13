import { DataTable, type Column } from '../../../components/data/DataTable';
import { BoolChip } from '../../../components/data/BoolChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListCaseStudiesQuery, useDeleteCaseStudyMutation } from '../../../graphql/generated';
import { CaseStudyForm, type CaseStudyRow } from './forms/case-study';

/** Website CMS — case studies. */
export function CaseStudiesPage() {
  const { data, loading, refetch } = useListCaseStudiesQuery();
  const [deleteCaseStudy] = useDeleteCaseStudyMutation();
  const dialog = useCrudDialog<CaseStudyRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listCaseStudies ?? [];
  const categoryCount = new Set(rows.map((r) => r.category).filter(Boolean)).size;
  const stats: StatItem[] = [
    { label: 'Case studies', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Featured', value: String(rows.filter((r) => r.featured).length), accent: '#f9851f' },
    { label: 'Active', value: String(rows.filter((r) => r.isActive).length), accent: '#7be37b' },
    { label: 'Categories', value: String(categoryCount), accent: '#b58cff' },
  ];

  const columns: Column<CaseStudyRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'category', label: 'Category' },
    { key: 'author', label: 'Author' },
    { key: 'featured', label: 'Featured', render: (r) => <BoolChip value={r.featured} /> },
    { key: 'publishedAt', label: 'Published', render: (r) => formatDate(r.publishedAt) },
  ];

  const handleDelete = async (row: CaseStudyRow) => {
    const ok = await confirm({ message: `Delete case study ${row.title}?`, confirmText: 'Delete' });
    if (!ok) return;
    await deleteCaseStudy({ variables: { id: row.id } });
    await refetch();
    notify('Case study deleted');
  };

  return (
    <ModuleDashboard
      title="Case studies"
      subtitle="Website case studies"
      actionLabel="New case study"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit case study' : 'New case study'}
          onClose={dialog.close}
        >
          <CaseStudyForm
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
        emptyMessage={loading ? 'Loading…' : 'No case studies yet.'}
      />
    </ModuleDashboard>
  );
}

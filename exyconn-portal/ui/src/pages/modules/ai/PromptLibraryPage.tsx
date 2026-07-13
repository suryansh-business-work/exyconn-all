import { Flex, Chip } from '@/components/ui';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useListPromptsQuery, useDeletePromptMutation } from '../../../graphql/generated';
import { PromptForm, type PromptRow } from './forms/prompt';

/** AI → Prompt Library: reusable prompts with CRUD and one-click copy. */
export function PromptLibraryPage() {
  const { data, loading, refetch } = useListPromptsQuery();
  const [deletePrompt] = useDeletePromptMutation();
  const dialog = useCrudDialog<PromptRow>();
  const confirm = useConfirm();
  const notify = useNotify();

  const rows = data?.listPrompts ?? [];
  const count = (c: string) => rows.filter((r) => r.category === c).length;
  const stats: StatItem[] = [
    { label: 'Prompts', value: String(rows.length), accent: '#6366f1' },
    { label: 'Coding', value: String(count('CODING')), accent: '#4f8cff' },
    { label: 'Writing', value: String(count('WRITING')), accent: '#22c55e' },
    { label: 'Marketing', value: String(count('MARKETING')), accent: '#ec4899' },
  ];

  const columns: Column<PromptRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category', render: (r) => <StatusChip value={r.category} /> },
    { key: 'content', label: 'Prompt', render: (r) => r.content.slice(0, 60) },
    {
      key: 'tags',
      label: 'Tags',
      render: (r) =>
        r.tags.length ? (
          <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {r.tags.map((t) => (
              <Chip key={t} size="small" variant="outlined" label={t} />
            ))}
          </Flex>
        ) : (
          '—'
        ),
    },
  ];

  const copyPrompt = async (row: PromptRow) => {
    try {
      await navigator.clipboard.writeText(row.content);
      notify('Prompt copied to clipboard');
    } catch {
      notify('Copy failed', 'error');
    }
  };

  const handleDelete = async (row: PromptRow) => {
    const ok = await confirm({ message: `Delete prompt "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) return;
    await deletePrompt({ variables: { id: row.id } });
    await refetch();
    notify('Prompt deleted');
  };

  return (
    <ModuleDashboard
      title="Prompt Library"
      subtitle="Reusable AI prompts"
      actionLabel="New prompt"
      onAction={dialog.openCreate}
      stats={stats}
      dialog={
        <CrudDialog
          open={dialog.open}
          title={dialog.editing ? 'Edit prompt' : 'New prompt'}
          onClose={dialog.close}
        >
          <PromptForm
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
        actions={[
          {
            icon: <ContentCopyIcon fontSize="small" />,
            tooltip: 'Copy prompt',
            ariaLabel: 'copy prompt',
            color: 'primary',
            onClick: copyPrompt,
          },
        ]}
        emptyMessage={loading ? 'Loading…' : 'No prompts yet.'}
      />
    </ModuleDashboard>
  );
}

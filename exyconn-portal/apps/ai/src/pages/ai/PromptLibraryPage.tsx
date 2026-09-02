import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  useListPromptsStatsQuery,
  useDeletePromptMutation,
  ListPromptsPagedDocument,
  type ListPromptsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { PromptForm, type PromptRow } from './forms/prompt';
import { PROMPT_COLUMNS, type PagedPromptRow, type PromptsGridContext } from './prompts-grid';

/** AI → Prompt Library: reusable prompts with a server-side grid, CRUD and one-click copy. */
export function PromptLibraryPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListPromptsStatsQuery();
  const [deletePrompt] = useDeletePromptMutation();
  const notify = useNotify();
  const crud = useCrudResource<PromptRow, PagedPromptRow>({
    label: 'Prompt',
    onDelete: (row) => deletePrompt({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete prompt "${row.title}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListPromptsPagedDocument,
    (data: ListPromptsPagedQuery) => data.listPromptsPaged,
  );

  const stats = statsData?.listPromptsStats;
  const statItems: StatItem[] = [
    { label: 'Prompts', value: String(statTotal(stats)), accent: '#6366f1' },
    { label: 'Coding', value: String(statCount(stats, 'category', 'CODING')), accent: '#4f8cff' },
    { label: 'Writing', value: String(statCount(stats, 'category', 'WRITING')), accent: '#22c55e' },
    {
      label: 'Marketing',
      value: String(statCount(stats, 'category', 'MARKETING')),
      accent: '#ec4899',
    },
  ];

  const copyPrompt = async (row: PagedPromptRow) => {
    try {
      await navigator.clipboard.writeText(row.content);
      notify('Prompt copied to clipboard');
    } catch {
      notify('Copy failed', 'error');
    }
  };

  const gridContext: PromptsGridContext = {
    actions: { copy: copyPrompt, edit: crud.openEdit, delete: crud.remove },
  };

  return (
    <CrudDashboard
      title="Prompt Library"
      subtitle="Reusable AI prompts"
      entityLabel="prompt"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <PromptForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={PROMPT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search prompts…"
    />
  );
}

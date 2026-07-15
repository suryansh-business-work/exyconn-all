import { useCallback, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { ServerDataGrid, type TablePageResult } from '../../../components/data/ServerDataGrid';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useCrudDialog } from '../../../hooks/useCrudDialog';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { statCount, statTotal } from '../../../components/data/tableStats';
import {
  useListPromptsStatsQuery,
  useDeletePromptMutation,
  ListPromptsPagedDocument,
  type ListPromptsPagedQuery,
  type ListPromptsPagedQueryVariables,
  type TableQueryInput,
} from '../../../graphql/generated';
import { PromptForm, type PromptRow } from './forms/prompt';
import { PROMPT_COLUMNS, type PagedPromptRow, type PromptsGridContext } from './prompts-grid';

/** AI → Prompt Library: reusable prompts with a server-side grid, CRUD and one-click copy. */
export function PromptLibraryPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListPromptsStatsQuery();
  const [deletePrompt] = useDeletePromptMutation();
  const dialog = useCrudDialog<PromptRow>();
  const confirm = useConfirm();
  const notify = useNotify();
  const client = useApolloClient();
  const [refreshSignal, setRefreshSignal] = useState(0);

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

  const reload = () => {
    setRefreshSignal((n) => n + 1);
    void refetchStats();
  };

  const fetchRows = useCallback(
    async (input: TableQueryInput): Promise<TablePageResult<PagedPromptRow>> => {
      const result = await client.query<ListPromptsPagedQuery, ListPromptsPagedQueryVariables>({
        query: ListPromptsPagedDocument,
        variables: { input },
        fetchPolicy: 'network-only',
      });
      return {
        rows: result.data.listPromptsPaged.rows,
        totalCount: result.data.listPromptsPaged.totalCount,
      };
    },
    [client],
  );

  const copyPrompt = async (row: PagedPromptRow) => {
    try {
      await navigator.clipboard.writeText(row.content);
      notify('Prompt copied to clipboard');
    } catch {
      notify('Copy failed', 'error');
    }
  };

  const handleDelete = async (row: PagedPromptRow) => {
    const ok = await confirm({ message: `Delete prompt "${row.title}"?`, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    await deletePrompt({ variables: { id: row.id } });
    reload();
    notify('Prompt deleted');
  };

  const gridContext: PromptsGridContext = {
    onEdit: dialog.openEdit,
    onDelete: handleDelete,
    onCopy: copyPrompt,
  };

  return (
    <ModuleDashboard
      title="Prompt Library"
      subtitle="Reusable AI prompts"
      actionLabel="New prompt"
      onAction={dialog.openCreate}
      stats={statItems}
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
              reload();
              dialog.close();
            }}
          />
        </CrudDialog>
      }
    >
      <ServerDataGrid<PagedPromptRow>
        columnDefs={PROMPT_COLUMNS}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={refreshSignal}
        searchPlaceholder="Search prompts…"
      />
    </ModuleDashboard>
  );
}

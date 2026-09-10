import { useState } from 'react';
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
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PromptForm, type PromptRow } from './forms/prompt';
import { RunPromptForm, type RunPromptTarget } from './forms/run-prompt';
import { AiJobResult } from './AiJobResult';
import { PROMPT_COLUMNS, type PagedPromptRow, type PromptsGridContext } from './prompts-grid';
import { color } from '@exyconn/shell/components/ui';

/** AI → Prompt Library: reusable prompts, each runnable against OpenAI without leaving the page. */
export function PromptLibraryPage() {
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const { data: statsData, refetch: refetchStats } = useListPromptsStatsQuery();
  const [deletePrompt] = useDeletePromptMutation();
  const notify = useNotify();
  const [runTarget, setRunTarget] = useState<RunPromptTarget | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
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
    { label: 'Prompts', value: String(statTotal(stats)), accent: color.indigo[400] },
    {
      label: 'Coding',
      value: String(statCount(stats, 'category', 'CODING')),
      accent: color.blue[400],
    },
    {
      label: 'Writing',
      value: String(statCount(stats, 'category', 'WRITING')),
      accent: color.green[500],
    },
    {
      label: 'Marketing',
      value: String(statCount(stats, 'category', 'MARKETING')),
      accent: color.pink[400],
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
    actions: { run: setRunTarget, copy: copyPrompt, edit: crud.openEdit, delete: crud.remove },
  };

  // The run is queued rather than finished, so the result dialog opens on a job that is
  // still waiting — it polls itself until the worker settles it.
  const onRunDone = (jobId: string) => {
    setRunTarget(null);
    setResultId(jobId);
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
      extraDialogs={
        <>
          <CrudDialog
            open={Boolean(runTarget)}
            title="Run prompt"
            onClose={() => setRunTarget(null)}
          >
            {runTarget && (
              <RunPromptForm
                prompt={runTarget}
                onDone={onRunDone}
                onCancel={() => setRunTarget(null)}
              />
            )}
          </CrudDialog>

          <CrudDialog open={Boolean(resultId)} title="Run result" onClose={() => setResultId(null)}>
            {resultId && <AiJobResult id={resultId} />}
          </CrudDialog>
        </>
      }
    />
  );
}

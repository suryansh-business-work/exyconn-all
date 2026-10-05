import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  WebsiteChatKnowledgePagedDocument,
  WebsiteChatKnowledgeSource,
  useDeleteWebsiteChatKnowledgeMutation,
  useWebsiteChatKnowledgeStatsQuery,
  type WebsiteChatKnowledgePagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ChatKnowledgeForm, type ChatKnowledgeRow } from '../forms/chat-knowledge';
import {
  CHAT_KNOWLEDGE_COLUMNS,
  type ChatKnowledgeGridContext,
  type ChatKnowledgePagedRow,
} from './chat-knowledge-grid';
import { KnowledgeSyncPanel } from './KnowledgeSyncPanel';

/**
 * Website > Chatbot > Knowledge Base — everything the Knowledge Bot may answer from: pages
 * read from exyconn.com by the sync, and the team's own custom entries.
 */
export function ChatKnowledgePage() {
  const { formatDate } = useSettings();
  const { data: statsData, loading: statsLoading, refetch } = useWebsiteChatKnowledgeStatsQuery();
  const [deleteKnowledge] = useDeleteWebsiteChatKnowledgeMutation();
  const crud = useCrudResource<ChatKnowledgeRow, ChatKnowledgePagedRow>({
    label: 'Knowledge',
    onDelete: (row) => deleteKnowledge({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete "{title}" from the knowledge base?',
      values: { title: row.title },
    }),
    refetch,
  });
  const fetchRows = usePagedFetcher(
    WebsiteChatKnowledgePagedDocument,
    (data: WebsiteChatKnowledgePagedQuery) => data.listWebsiteChatKnowledgeEntriesPaged,
  );

  const stats = statsData?.listWebsiteChatKnowledgeEntriesStats;
  const statItems: StatItem[] = [
    { label: 'Entries', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'From the website',
      value: String(statCount(stats, 'source', WebsiteChatKnowledgeSource.Website)),
      accent: color.orange[500],
    },
    {
      label: 'Custom',
      value: String(statCount(stats, 'source', WebsiteChatKnowledgeSource.Custom)),
      accent: color.violet[200],
    },
    {
      label: 'Active',
      value: String(statCount(stats, 'isActive', 'true')),
      accent: color.green[500],
    },
  ];

  const gridContext: ChatKnowledgeGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Knowledge base"
      subtitle="What the Knowledge Bot may answer from"
      entityLabel="knowledge entry"
      actionLabel="New custom entry"
      exportFileName="chatbot-knowledge"
      stats={statItems}
      statsLoading={!statsData && statsLoading}
      crud={crud}
      renderForm={(initial) => (
        <ChatKnowledgeForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CHAT_KNOWLEDGE_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search titles, links and content…"
      toolbar={<KnowledgeSyncPanel onSynced={crud.reload} />}
    />
  );
}

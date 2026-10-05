import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  WebsiteChatSessionsPagedDocument,
  WebsiteChatSite,
  WebsiteChatStatus,
  useDeleteWebsiteChatSessionMutation,
  useWebsiteChatSessionStatsQuery,
  type WebsiteChatSessionsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { chatSessionPath } from '../chat.routes';
import { useCloseChat } from '../useCloseChat';
import {
  CHAT_SESSION_COLUMNS,
  type ChatSessionRow,
  type ChatSessionsGridContext,
} from './chat-sessions-grid';
import {
  EMPTY_CHAT_SESSION_FILTERS,
  chatSessionFilters,
  type ChatSessionFilterState,
} from './chat-sessions.filters';
import { ChatSessionsToolbar } from './ChatSessionsToolbar';
import { useLiveChatList } from './useLiveChatList';

/**
 * Website > Chatbot > Chat Sessions — every conversation started in the chat widget on
 * exyconn.com and the tools site. The list stays live over the chat socket: a new chat or a
 * new message re-reads it. Chats are started by visitors, never here.
 */
export function ChatSessionsPage() {
  const navigate = useNavigate();
  const { formatDate, formatRelative } = useSettings();
  const { data: statsData, loading: statsLoading, refetch } = useWebsiteChatSessionStatsQuery();
  const [deleteSession] = useDeleteWebsiteChatSessionMutation();
  const [filters, setFilters] = useState<ChatSessionFilterState>(EMPTY_CHAT_SESSION_FILTERS);

  const crud = useCrudResource<ChatSessionRow, ChatSessionRow>({
    label: 'Chat',
    onDelete: (row) => deleteSession({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the chat with {name} and every message in it?',
      values: { name: row.name },
    }),
    refetch,
  });
  const fetchRows = usePagedFetcher(
    WebsiteChatSessionsPagedDocument,
    (data: WebsiteChatSessionsPagedQuery) => data.websiteChatSessionsPaged,
    chatSessionFilters(filters),
  );
  const { reload } = crud;
  const arrival = useLiveChatList(reload);
  const closeChat = useCloseChat(reload);

  const changeFilters = useCallback(
    (next: ChatSessionFilterState) => {
      setFilters(next);
      reload();
    },
    [reload],
  );

  const stats = statsData?.websiteChatSessionStats;
  const statItems: StatItem[] = [
    { label: 'Chats', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Open',
      value: String(statCount(stats, 'status', WebsiteChatStatus.Open)),
      accent: color.green[500],
    },
    {
      label: 'Closed',
      value: String(statCount(stats, 'status', WebsiteChatStatus.Closed)),
      accent: color.amber[200],
    },
    {
      label: 'Website / tools',
      value: `${statCount(stats, 'site', WebsiteChatSite.Website)} / ${statCount(stats, 'site', WebsiteChatSite.Tools)}`,
      accent: color.violet[200],
    },
  ];

  const open = (row: ChatSessionRow) => navigate(chatSessionPath(row.id));
  const gridContext: ChatSessionsGridContext = {
    actions: { open, close: closeChat, delete: crud.remove },
    formatDate,
    formatRelative,
  };

  return (
    <CrudDashboard
      title="Chat sessions"
      subtitle="Conversations from the chat widget on exyconn.com and the tools site"
      entityLabel="chat"
      exportFileName="website-chats"
      stats={statItems}
      statsLoading={!statsData && statsLoading}
      refreshSignal={crud.refreshSignal}
      columnDefs={CHAT_SESSION_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      onRowClick={open}
      searchPlaceholder="Search by name, email, phone, ticket or message…"
      toolbar={
        <ChatSessionsToolbar filters={filters} onFiltersChange={changeFilters} arrival={arrival} />
      }
    />
  );
}

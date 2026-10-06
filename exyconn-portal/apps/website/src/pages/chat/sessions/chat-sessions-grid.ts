import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {
  DELETE_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import {
  WebsiteChatSite,
  WebsiteChatStatus,
  type WebsiteChatSessionsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import {
  AssigneeCell,
  ClosesInCell,
  LastMessageCell,
  UnreadCell,
  VisitorCell,
} from './chat-sessions-cells';

export type ChatSessionRow =
  WebsiteChatSessionsPagedQuery['websiteChatSessionsPaged']['rows'][number];

export interface ChatSessionsGridContext extends DatedCrudGridContext<ChatSessionRow> {
  /** "5 minutes ago", in the viewer's language and timezone. */
  formatRelative: (value: string) => string;
}

/** The public site a chat was started on, as people say it. */
export const SITE_LABEL: Record<WebsiteChatSite, string> = {
  [WebsiteChatSite.Website]: 'exyconn.com',
  [WebsiteChatSite.Tools]: 'Tools site',
};

const OPEN_ACTION: RowActionSpec = { key: 'open', label: 'open chat', icon: OpenInNewIcon };

const CLOSE_ACTION: RowActionSpec = {
  key: 'close',
  label: 'close chat',
  icon: DoneAllIcon,
  color: 'success',
  hidden: (row: ChatSessionRow) => row.status === WebsiteChatStatus.Closed,
};

const relativeLastMessage = (params: ValueFormatterParams<ChatSessionRow>): string => {
  const row = params.data;
  if (!row) {
    return '';
  }
  const { formatRelative } = params.context as ChatSessionsGridContext;
  const when = row.lastMessageAt ? formatRelative(row.lastMessageAt) : '';
  return [row.lastMessagePreview, when].filter(Boolean).join(' · ');
};

const relativeExpiry = (params: ValueFormatterParams<ChatSessionRow>): string => {
  const row = params.data;
  if (row?.status !== WebsiteChatStatus.Open || !row.expiresAt) {
    return '';
  }
  return (params.context as ChatSessionsGridContext).formatRelative(row.expiresAt);
};

/**
 * Column model for Website > Chatbot > Chat Sessions. Name, email, phone, ticket and the last
 * message are what the search box looks through; the toolbar holds the other filters. Only the
 * columns the server can sort by are sortable, and only the assignee has a column filter.
 */
export const CHAT_SESSION_COLUMNS: ColDef<ChatSessionRow>[] = [
  {
    ...valueColumn<ChatSessionRow>('name', 'Visitor', (row) =>
      [row.name, row.email, row.phone].filter(Boolean).join(' · '),
    ),
    cellRenderer: VisitorCell,
    minWidth: 220,
  },
  valueColumn('site', 'Site', (row, t) => t(SITE_LABEL[row.site])),
  statusColumn('status', 'Status'),
  {
    ...valueColumn<ChatSessionRow>('ticketReference', 'Ticket', (row) => row.ticketReference),
    sortable: false,
  },
  {
    ...textColumn<ChatSessionRow>(
      'assigneeName',
      'Assignee',
      (row, t) => row.assigneeName || t('Unassigned'),
    ),
    cellRenderer: AssigneeCell,
    sortable: false,
  },
  {
    field: 'lastMessageAt',
    headerName: 'Last message',
    cellRenderer: LastMessageCell,
    valueFormatter: relativeLastMessage,
    filter: false,
    floatingFilter: false,
    minWidth: 240,
  },
  {
    field: 'expiresAt',
    headerName: 'Closes',
    cellRenderer: ClosesInCell,
    valueFormatter: relativeExpiry,
    sortable: false,
    filter: false,
    floatingFilter: false,
  },
  {
    ...valueColumn<ChatSessionRow>('staffUnread', 'Unread', (row) => String(row.staffUnread)),
    cellRenderer: UnreadCell,
    sortable: false,
  },
  valueColumn('messageCount', 'Messages', (row) => String(row.messageCount)),
  dateColumn('createdAt', 'Started'),
  actionsColumn([OPEN_ACTION, CLOSE_ACTION, DELETE_ACTION]),
];

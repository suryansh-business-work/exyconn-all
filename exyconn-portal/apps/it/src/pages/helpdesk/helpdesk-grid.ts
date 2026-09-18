import type { ColDef } from 'ag-grid-community';
import ForumIcon from '@mui/icons-material/Forum';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  derivedStatusColumn,
  statusColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListSupportTicketsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedItTicketRow =
  ListSupportTicketsPagedQuery['listSupportTicketsPaged']['rows'][number];

export type HelpdeskGridContext = DatedCrudGridContext<PagedItTicketRow>;

const OPEN_ACTION: RowActionSpec = {
  key: 'open',
  label: 'open ticket',
  icon: ForumIcon,
  color: 'primary',
};

const PAGE_ACTION: RowActionSpec = { key: 'page', label: 'open ticket page', icon: OpenInNewIcon };

/** Column model for IT's slice of the ticket queue. */
export const HELPDESK_COLUMNS: ColDef<PagedItTicketRow>[] = [
  valueColumn('reference', 'Ref', (row) => row.reference),
  valueColumn('subject', 'Subject', (row) => row.subject),
  derivedColumn('raisedBy', 'Raised by', (row) => row.employeeName ?? '—'),
  derivedColumn('topic', 'Topic', (row) => row.topic || '—'),
  statusColumn('priority', 'Priority'),
  statusColumn('status', 'Status'),
  derivedStatusColumn('slaState', 'SLA', (row) => row.slaState),
  derivedColumn('escalationLevel', 'Escalated', (row) =>
    row.escalationLevel > 0 ? `L${row.escalationLevel}` : '—',
  ),
  valueColumn('assigneeName', 'Assigned to', (row, t) => row.assigneeName || t('Unassigned')),
  dateColumn('createdAt', 'Raised'),
  actionsColumn([OPEN_ACTION, PAGE_ACTION]),
];

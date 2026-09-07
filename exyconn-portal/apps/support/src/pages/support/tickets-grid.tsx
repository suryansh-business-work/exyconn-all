import type { ColDef } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
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
import {
  SupportRequester,
  type ListSupportTicketsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type PagedTicketRow =
  ListSupportTicketsPagedQuery['listSupportTicketsPaged']['rows'][number];

/** Row handlers ag-grid hands to the shared action cells via its `context`. */
export type TicketsGridContext = DatedCrudGridContext<PagedTicketRow>;

const OPEN_ACTION: RowActionSpec = {
  key: 'open',
  label: 'open ticket',
  icon: ForumIcon,
  color: 'primary',
};

const PAGE_ACTION: RowActionSpec = {
  key: 'page',
  label: 'open ticket page',
  icon: OpenInNewIcon,
};

const STATUS_ACTION: RowActionSpec = { key: 'status', label: 'update status', icon: EditIcon };

/**
 * Who asked. A customer ticket names the client it was attributed to, falling back to
 * the person who wrote in when the address matched nothing on file; an employee ticket
 * names the employee.
 */
export function raisedBy(row: PagedTicketRow): string {
  if (row.requesterType === SupportRequester.Client) {
    return row.clientName || row.requesterName || row.requesterEmail;
  }
  return row.employeeName ?? '—';
}

/**
 * Column model for the support console. Subject and assignee sort on the server but
 * do not offer a column filter: the free-text search already covers them, and the
 * quick filters above the grid cover the assignee and the requester.
 */
export const TICKET_COLUMNS: ColDef<PagedTicketRow>[] = [
  derivedColumn('raisedBy', 'Raised by', raisedBy),
  statusColumn('requesterType', 'Kind'),
  valueColumn('subject', 'Subject', (row) => row.subject),
  statusColumn('category', 'Category'),
  statusColumn('priority', 'Priority'),
  statusColumn('status', 'Status'),
  derivedStatusColumn('slaState', 'SLA', (row) => row.slaState),
  valueColumn('assigneeName', 'Assigned to', (row) => row.assigneeName || 'Unassigned'),
  dateColumn('createdAt', 'Raised'),
  actionsColumn([OPEN_ACTION, PAGE_ACTION, STATUS_ACTION]),
];

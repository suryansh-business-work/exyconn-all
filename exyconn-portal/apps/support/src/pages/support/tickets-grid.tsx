import type { ColDef } from 'ag-grid-community';
import EditIcon from '@mui/icons-material/Edit';
import ForumIcon from '@mui/icons-material/Forum';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  valueColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ListSupportTicketsPagedQuery } from '@exyconn/shell/graphql/generated';

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

const STATUS_ACTION: RowActionSpec = { key: 'status', label: 'update status', icon: EditIcon };

/**
 * Column model for the support console. Subject and assignee sort on the server but
 * do not offer a column filter: the free-text search already covers them, and the
 * quick filters above the grid cover the assignee.
 */
export const TICKET_COLUMNS: ColDef<PagedTicketRow>[] = [
  derivedColumn('employee', 'Employee', (row) => row.employeeName ?? '—'),
  valueColumn('subject', 'Subject', (row) => row.subject),
  statusColumn('category', 'Category'),
  statusColumn('priority', 'Priority'),
  statusColumn('status', 'Status'),
  valueColumn('assigneeName', 'Assigned to', (row) => row.assigneeName || 'Unassigned'),
  dateColumn('createdAt', 'Raised'),
  actionsColumn([OPEN_ACTION, STATUS_ACTION]),
];

import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import {
  DELETE_ACTION,
  EDIT_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import { Chip } from '@exyconn/shell/components/ui';
import type { ListBugsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedBugRow = ListBugsPagedQuery['listBugsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type BugsGridContext = DatedCrudGridContext<PagedBugRow>;

/** The board ticket the bug became; blank until it is promoted. */
function TicketKeyCell(params: Readonly<ICellRendererParams<PagedBugRow>>) {
  const key = params.data?.taskKey;
  if (!key) {
    return null;
  }
  return <Chip size="small" label={key} />;
}

/** Only a bug that is not yet a ticket can be promoted. */
const PROMOTE_ACTION: RowActionSpec = {
  key: 'promote',
  label: 'promote to ticket',
  icon: ConfirmationNumberIcon,
  color: 'primary',
  hidden: (row: PagedBugRow) => row.taskKey !== '',
};

/** Column model for the server-side Bugs grid. Title/Project/Assignee hit the server filter. */
export const BUG_COLUMNS: ColDef<PagedBugRow>[] = [
  textColumn('title', 'Title'),
  textColumn('projectName', 'Project', (row) => row.projectName || '—'),
  textColumn('assigneeName', 'Assignee'),
  statusColumn('severity', 'Severity'),
  statusColumn('status', 'Status'),
  {
    field: 'taskKey',
    headerName: 'Ticket',
    cellRenderer: TicketKeyCell,
    filter: false,
    floatingFilter: false,
    maxWidth: 130,
  },
  dateColumn('dueDate', 'Due'),
  actionsColumn([PROMOTE_ACTION, EDIT_ACTION, DELETE_ACTION]),
];

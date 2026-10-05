import type { ColDef } from 'ag-grid-community';
import ForumIcon from '@mui/icons-material/Forum';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
  type RowActionSpec,
} from '@exyconn/crud';
import type { ClientHubTicketsQuery } from '@exyconn/shell/graphql/generated';

export type ClientTicketRow = ClientHubTicketsQuery['clientHubTickets']['rows'][number];
export type TicketsGridContext = DatedCrudGridContext<ClientTicketRow>;

const OPEN_ACTION: RowActionSpec = {
  key: 'open',
  label: 'open the conversation',
  icon: ForumIcon,
  color: 'primary',
};

/** The client's support tickets, most recently active first. */
export const TICKET_COLUMNS: ColDef<ClientTicketRow>[] = [
  textColumn('reference', 'Reference'),
  textColumn('subject', 'Subject'),
  statusColumn('priority', 'Priority'),
  statusColumn('status', 'Status'),
  dateColumn('createdAt', 'Raised'),
  dateColumn('updatedAt', 'Last update'),
  actionsColumn([OPEN_ACTION]),
];

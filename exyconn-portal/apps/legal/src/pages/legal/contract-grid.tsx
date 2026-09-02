import type { ColDef } from 'ag-grid-community';
import SendIcon from '@mui/icons-material/Send';
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
import type { ListContractsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedContractRow = ListContractsPagedQuery['listContractsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type ContractsGridContext = DatedCrudGridContext<PagedContractRow>;

const SEND_ACTION: RowActionSpec = {
  key: 'send',
  label: 'send contract',
  icon: SendIcon,
  color: 'primary',
};

/** Column model for the server-side Contracts grid. Title/Party hit the server filter. */
export const CONTRACT_COLUMNS: ColDef<PagedContractRow>[] = [
  textColumn('title', 'Title'),
  textColumn('party', 'Party'),
  statusColumn('type', 'Type'),
  dateColumn('expiryDate', 'Expires'),
  statusColumn('status', 'Status'),
  dateColumn('sentAt', 'Sent', '—'),
  actionsColumn([EDIT_ACTION, SEND_ACTION, DELETE_ACTION]),
];

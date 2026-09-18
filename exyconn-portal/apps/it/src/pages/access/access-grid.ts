import type { ColDef } from 'ag-grid-community';
import GavelIcon from '@mui/icons-material/Gavel';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import BlockIcon from '@mui/icons-material/Block';
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
import {
  ItAccessStatus,
  type ListItAccessRequestsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type PagedAccessRequestRow =
  ListItAccessRequestsPagedQuery['listItAccessRequestsPaged']['rows'][number];

export type AccessGridContext = DatedCrudGridContext<PagedAccessRequestRow>;

const isPending = (row: PagedAccessRequestRow) => row.status === ItAccessStatus.Pending;
const isApproved = (row: PagedAccessRequestRow) => row.status === ItAccessStatus.Approved;

const DECIDE_ACTION: RowActionSpec = {
  key: 'decide',
  label: 'approve or reject',
  icon: GavelIcon,
  color: 'primary',
  hidden: (row: PagedAccessRequestRow) => !isPending(row),
};

const FULFIL_ACTION: RowActionSpec = {
  key: 'fulfil',
  label: 'mark as done',
  icon: TaskAltIcon,
  color: 'success',
  hidden: (row: PagedAccessRequestRow) => !isApproved(row),
};

const CANCEL_ACTION: RowActionSpec = {
  key: 'cancel',
  label: 'cancel request',
  icon: BlockIcon,
  hidden: (row: PagedAccessRequestRow) => !isPending(row) && !isApproved(row),
};

/** Only a request nobody has acted on may still be edited. */
const EDIT_PENDING: RowActionSpec = {
  ...EDIT_ACTION,
  hidden: (row: PagedAccessRequestRow) => !isPending(row),
};

/** Column model for access requests and password resets. */
export const ACCESS_COLUMNS: ColDef<PagedAccessRequestRow>[] = [
  textColumn('employeeName', 'Employee'),
  textColumn('application', 'Application'),
  statusColumn('kind', 'Request'),
  textColumn('accessLevel', 'Level'),
  statusColumn('status', 'Status'),
  textColumn('decidedByName', 'Decided by'),
  dateColumn('createdAt', 'Raised'),
  actionsColumn([DECIDE_ACTION, FULFIL_ACTION, CANCEL_ACTION, EDIT_PENDING, DELETE_ACTION]),
];

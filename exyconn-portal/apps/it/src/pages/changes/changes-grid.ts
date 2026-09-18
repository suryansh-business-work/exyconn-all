import type { ColDef } from 'ag-grid-community';
import GavelIcon from '@mui/icons-material/Gavel';
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
import { ItChangeStatus, type ListItChangesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedChangeRow = ListItChangesPagedQuery['listItChangesPaged']['rows'][number];

export type ChangesGridContext = DatedCrudGridContext<PagedChangeRow>;

const DECIDE_ACTION: RowActionSpec = {
  key: 'decide',
  label: 'approve or reject',
  icon: GavelIcon,
  color: 'primary',
  hidden: (row: PagedChangeRow) => row.status !== ItChangeStatus.PendingApproval,
};

/** Column model for the change register — its status is the change history. */
export const CHANGE_COLUMNS: ColDef<PagedChangeRow>[] = [
  textColumn('title', 'Change'),
  textColumn('system', 'System'),
  statusColumn('type', 'Type'),
  statusColumn('risk', 'Risk'),
  statusColumn('environment', 'Environment'),
  dateColumn('plannedStart', 'Starts'),
  statusColumn('status', 'Status'),
  textColumn('decidedByName', 'Decided by'),
  actionsColumn([DECIDE_ACTION, EDIT_ACTION, DELETE_ACTION]),
];

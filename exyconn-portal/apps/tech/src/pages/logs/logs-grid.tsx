import type { ColDef } from 'ag-grid-community';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
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
import type { ListAppLogGroupsPagedQuery } from '@exyconn/shell/graphql/generated';

export type AppLogRow = ListAppLogGroupsPagedQuery['listAppLogGroupsPaged']['rows'][number];

/** `formatDate` is the viewer's date AND time here — when it happened is the point of a log. */
export type LogsGridContext = DatedCrudGridContext<AppLogRow>;

export const VIEW_ACTION: RowActionSpec = {
  key: 'view',
  label: 'view details',
  icon: VisibilityIcon,
};

export const CLAUDE_ACTION: RowActionSpec = {
  key: 'claude',
  label: 'copy fix prompt for Claude',
  icon: SmartToyIcon,
  color: 'primary',
};

export const RESOLVE_ACTION: RowActionSpec = {
  key: 'resolve',
  label: 'mark resolved',
  icon: TaskAltIcon,
  color: 'success',
};

/**
 * One row per distinct problem, newest first. Source, level and status are the toolbar's
 * quick filters; the text columns filter server-side from the grid's own filter row.
 */
export const LOG_COLUMNS: ColDef<AppLogRow>[] = [
  dateColumn('lastSeenAt', 'Last seen'),
  statusColumn('level', 'Level'),
  statusColumn('source', 'Source'),
  textColumn('app', 'App'),
  textColumn('message', 'What happened', (row) =>
    row.errorName ? `${row.errorName}: ${row.message}` : row.message,
  ),
  valueColumn('count', 'Times', (row) => row.count.toLocaleString()),
  valueColumn('userCount', 'People', (row) => row.userCount.toLocaleString()),
  textColumn('lastUserName', 'Last seen by', (row) => row.lastUserName || row.lastUserEmail || '—'),
  textColumn('route', 'Screen / page'),
  textColumn('platform', 'Platform'),
  textColumn('appVersion', 'Version'),
  statusColumn('status', 'Status'),
  dateColumn('firstSeenAt', 'First seen'),
  actionsColumn([VIEW_ACTION, CLAUDE_ACTION, RESOLVE_ACTION, DELETE_ACTION]),
];

import type { ColDef } from 'ag-grid-community';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
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
import type { ListProjectsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedProjectRow = ListProjectsPagedQuery['listProjectsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type ProjectsGridContext = DatedCrudGridContext<PagedProjectRow>;

const BOARD_ACTION: RowActionSpec = {
  key: 'board',
  label: 'open board',
  icon: ViewKanbanIcon,
  color: 'primary',
};

/** Column model for the server-side Projects grid. Name/Description hit the server filter. */
export const PROJECT_COLUMNS: ColDef<PagedProjectRow>[] = [
  textColumn('name', 'Name'),
  statusColumn('status', 'Status'),
  dateColumn('startDate', 'Start', '—'),
  dateColumn('endDate', 'End', '—'),
  textColumn('description', 'Description', (row) => row.description ?? '—'),
  actionsColumn([BOARD_ACTION, EDIT_ACTION, DELETE_ACTION]),
];

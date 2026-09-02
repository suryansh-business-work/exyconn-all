import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListBugsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedBugRow = ListBugsPagedQuery['listBugsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type BugsGridContext = DatedCrudGridContext<PagedBugRow>;

/** Column model for the server-side Bugs grid. Title/Assignee hit the server filter. */
export const BUG_COLUMNS: ColDef<PagedBugRow>[] = [
  textColumn('title', 'Title'),
  textColumn('assignee', 'Assignee'),
  statusColumn('severity', 'Severity'),
  statusColumn('status', 'Status'),
  dateColumn('dueDate', 'Due'),
  actionsColumn(),
];

import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListActivitiesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedActivityRow = ListActivitiesPagedQuery['listActivitiesPaged']['rows'][number];
export type ActivitiesGridContext = CrudGridContext<PagedActivityRow>;

/** Column model for the server-side Activities grid. */
export const ACTIVITY_COLUMNS: ColDef<PagedActivityRow>[] = [
  textColumn('subject', 'Subject'),
  statusColumn('type', 'Type'),
  statusColumn('relatedType', 'About'),
  textColumn('relatedName', 'Related to'),
  dateColumn('dueDate', 'Due'),
  boolColumn('done', 'Done'),
  textColumn('owner', 'Owner'),
  actionsColumn(),
];

import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListGigsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedGigRow = ListGigsPagedQuery['listGigsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type GigsGridContext = DatedCrudGridContext<PagedGigRow>;

/** Column model for the server-side Gigs grid. Title/Code/Category hit the server filter. */
export const GIG_COLUMNS: ColDef<PagedGigRow>[] = [
  textColumn('title', 'Title'),
  textColumn('gigCode', 'Code'),
  textColumn('category', 'Category'),
  textColumn('budget', 'Budget'),
  statusColumn('status', 'Status'),
  dateColumn('postedDate', 'Posted'),
  actionsColumn(),
];

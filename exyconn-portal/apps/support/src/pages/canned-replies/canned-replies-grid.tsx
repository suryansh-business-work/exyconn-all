import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  boolColumn,
  statusColumn,
  textColumn,
  type CrudGridContext,
} from '@exyconn/crud';
import type { ListCannedRepliesPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedCannedReplyRow =
  ListCannedRepliesPagedQuery['listCannedRepliesPaged']['rows'][number];
export type CannedRepliesGridContext = CrudGridContext<PagedCannedReplyRow>;

/** Column model for the canned reply register. */
export const CANNED_REPLY_COLUMNS: ColDef<PagedCannedReplyRow>[] = [
  textColumn('title', 'Snippet'),
  statusColumn('category', 'Category'),
  textColumn('body', 'Text'),
  boolColumn('isActive', 'Offered'),
  actionsColumn(),
];

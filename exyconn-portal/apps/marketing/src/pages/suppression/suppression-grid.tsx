import type { ColDef } from 'ag-grid-community';
import {
  DELETE_ACTION,
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListMarketingSuppressionsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedSuppressionRow =
  ListMarketingSuppressionsPagedQuery['listMarketingSuppressionsPaged']['rows'][number];

/** Row handlers and date formatting ag-grid hands to the shared cells via its `context`. */
export type SuppressionGridContext = DatedCrudGridContext<PagedSuppressionRow>;

/**
 * Column model for the suppression list. There is no edit action: a row is a record of
 * something that happened, and the only correction that makes sense is removing it.
 */
export const SUPPRESSION_COLUMNS: ColDef<PagedSuppressionRow>[] = [
  textColumn('email', 'Email'),
  statusColumn('reason', 'Reason'),
  textColumn('source', 'Source', (row) => row.source || '—'),
  dateColumn('createdAt', 'Added'),
  actionsColumn([DELETE_ACTION]),
];

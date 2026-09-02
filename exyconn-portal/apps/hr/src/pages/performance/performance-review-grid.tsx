import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  statusColumn,
  textColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListPerformanceReviewsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedPerformanceReviewRow =
  ListPerformanceReviewsPagedQuery['listPerformanceReviewsPaged']['rows'][number];

/** Row handlers plus the date formatter ag-grid hands to shared cells via `context`. */
export type PerformanceReviewGridContext = DatedCrudGridContext<PagedPerformanceReviewRow>;

/** Column model for the server-side Performance grid. */
export const PERFORMANCE_REVIEW_COLUMNS: ColDef<PagedPerformanceReviewRow>[] = [
  textColumn('cycle', 'Cycle'),
  textColumn('rating', 'Rating'),
  statusColumn('status', 'Status'),
  dateColumn('updatedAt', 'Updated'),
  actionsColumn(),
];

import type { ColDef } from 'ag-grid-community';
import { actionsColumn, dateColumn, statusColumn, textColumn } from '@exyconn/crud';
import { employeeNameColumn, type NamedGridContext } from '../../grid/employee-name-column';
import type { ListPerformanceReviewsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedPerformanceReviewRow =
  ListPerformanceReviewsPagedQuery['listPerformanceReviewsPaged']['rows'][number];

/** Row handlers, the date formatter and the employee-name lookup ag-grid hands to shared cells. */
export type PerformanceReviewGridContext = NamedGridContext<PagedPerformanceReviewRow>;

/** Column model for the server-side Performance grid. */
export const PERFORMANCE_REVIEW_COLUMNS: ColDef<PagedPerformanceReviewRow>[] = [
  employeeNameColumn(),
  textColumn('cycle', 'Cycle'),
  textColumn('rating', 'Rating'),
  statusColumn('status', 'Status'),
  dateColumn('updatedAt', 'Updated'),
  actionsColumn(),
];

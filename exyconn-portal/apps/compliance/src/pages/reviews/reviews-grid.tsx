import type { ColDef } from 'ag-grid-community';
import {
  actionsColumn,
  dateColumn,
  derivedColumn,
  statusColumn,
  textColumn,
  valueColumn,
  type DatedCrudGridContext,
} from '@exyconn/crud';
import type { ListManagementReviewsPagedQuery } from '@exyconn/shell/graphql/generated';

export type PagedReviewRow =
  ListManagementReviewsPagedQuery['listManagementReviewsPaged']['rows'][number];

export type ReviewsGridContext = DatedCrudGridContext<PagedReviewRow>;

/** Each review, and how much of what it decided is still outstanding. */
export const REVIEW_COLUMNS: ColDef<PagedReviewRow>[] = [
  textColumn('reference', 'Ref'),
  textColumn('title', 'Review'),
  dateColumn('heldOn', 'Held'),
  textColumn('chairName', 'Chair'),
  derivedColumn<PagedReviewRow>('standards', 'Standards', (row) =>
    row.standards.map((standard) => standard.replace('_', ' ')).join(', '),
  ),
  valueColumn('openActionCount', 'Open actions', (row) => String(row.openActionCount)),
  statusColumn('status', 'Status'),
  actionsColumn(),
];

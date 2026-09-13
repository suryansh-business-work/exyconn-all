import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { color } from '@exyconn/shell/components/ui';
import {
  useListManagementReviewsStatsQuery,
  useDeleteManagementReviewMutation,
  ListManagementReviewsPagedDocument,
  type ListManagementReviewsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ReviewForm, type ReviewRow } from './forms/review';
import { REVIEW_COLUMNS, type PagedReviewRow, type ReviewsGridContext } from './reviews-grid';

/**
 * Management reviews (clause 9.3) — the meetings at which the people who run the company
 * decide whether the management system is working, and what to change.
 */
export function ReviewsPage() {
  const { data: statsData, refetch } = useListManagementReviewsStatsQuery();
  const [deleteReview] = useDeleteManagementReviewMutation();
  const { formatDate } = useSettings();
  const crud = useCrudResource<ReviewRow, PagedReviewRow>({
    label: 'Management review',
    onDelete: (row) => deleteReview({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete review "${row.reference} — ${row.title}"?`,
    refetch,
  });
  const fetchRows = usePagedFetcher(
    ListManagementReviewsPagedDocument,
    (data: ListManagementReviewsPagedQuery) => data.listManagementReviewsPaged,
  );

  const stats = statsData?.listManagementReviewsStats;
  const statItems: StatItem[] = [
    { label: 'Reviews', value: String(statTotal(stats)), accent: color.teal[600] },
    {
      label: 'Planned',
      value: String(statCount(stats, 'status', 'PLANNED')),
      accent: color.blue[400],
    },
    { label: 'Held', value: String(statCount(stats, 'status', 'HELD')), accent: color.orange[500] },
    {
      label: 'Minuted',
      value: String(statCount(stats, 'status', 'MINUTED')),
      accent: color.green[300],
    },
  ];

  const gridContext: ReviewsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Management review"
      subtitle="What leadership considered, what it decided, and what is still outstanding"
      entityLabel="review"
      exportFileName="management-reviews"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ReviewForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={REVIEW_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by reference, review, chair or decision…"
    />
  );
}

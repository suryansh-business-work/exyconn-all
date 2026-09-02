import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useListPerformanceReviewsStatsQuery,
  useDeletePerformanceReviewMutation,
  ListPerformanceReviewsPagedDocument,
  type ListPerformanceReviewsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { PerformanceReviewForm, type PerformanceReviewRow } from './forms/performance-review';
import {
  PERFORMANCE_REVIEW_COLUMNS,
  type PagedPerformanceReviewRow,
  type PerformanceReviewGridContext,
} from './performance-review-grid';

/** Performance — server-paged admin grid over the review records. */
export function PerformancePage() {
  const { data: statsData, refetch: refetchStats } = useListPerformanceReviewsStatsQuery();
  const [deletePerformanceReview] = useDeletePerformanceReviewMutation();
  const { formatDate } = useSettings();

  const crud = useCrudResource<PerformanceReviewRow, PagedPerformanceReviewRow>({
    label: 'PerformanceReview',
    onDelete: (row) => deletePerformanceReview({ variables: { id: row.id } }),
    confirmMessage: () => 'Delete this review?',
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListPerformanceReviewsPagedDocument,
    (data: ListPerformanceReviewsPagedQuery) => data.listPerformanceReviewsPaged,
  );

  const stats = statsData?.listPerformanceReviewsStats;
  const statItems: StatItem[] = [
    { label: 'Reviews', value: String(statTotal(stats)), accent: '#0ea5e9' },
    { label: 'Open', value: String(statCount(stats, 'status', 'OPEN')), accent: '#0ea5e9' },
    {
      label: 'Self submitted',
      value: String(statCount(stats, 'status', 'SELF_SUBMITTED')),
      accent: '#0ea5e9',
    },
    { label: 'Closed', value: String(statCount(stats, 'status', 'CLOSED')), accent: '#0ea5e9' },
  ];

  const gridContext: PerformanceReviewGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Performance"
      subtitle="Appraisal cycles and ratings"
      entityLabel="review"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <PerformanceReviewForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={PERFORMANCE_REVIEW_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search reviews…"
    />
  );
}

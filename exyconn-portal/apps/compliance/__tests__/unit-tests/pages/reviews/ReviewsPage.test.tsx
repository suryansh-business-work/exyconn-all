import { vi } from 'vitest';
import { ListManagementReviewsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ReviewsPage } from '../../../../src/pages/reviews';
import { ReviewForm } from '../../../../src/pages/reviews/forms/review';
import { REVIEW_COLUMNS } from '../../../../src/pages/reviews/reviews-grid';
import { reviewRow } from '../compliance.fixtures';
import { describeCrudPage } from '../crud-page.suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListManagementReviewsStatsQuery: gql.stats,
  useDeleteManagementReviewMutation: () => [gql.remove],
}));

describeCrudPage({
  name: 'ReviewsPage',
  Page: ReviewsPage,
  Form: ReviewForm,
  title: 'Management review',
  entityLabel: 'review',
  exportFileName: 'management-reviews',
  label: 'Management review',
  columns: REVIEW_COLUMNS,
  row: reviewRow(),
  confirm: {
    message: 'Delete review "{reference} — {title}"?',
    values: { reference: 'MR-0001', title: 'Q3 management review' },
  },
  statsQuery: gql.stats,
  statsKey: 'listManagementReviewsStats',
  totalLabel: 'Reviews',
  buckets: [
    { label: 'Planned', field: 'status', value: 'PLANNED' },
    { label: 'Held', field: 'status', value: 'HELD' },
    { label: 'Minuted', field: 'status', value: 'MINUTED' },
  ],
  deleteMutation: gql.remove,
  pagedDocument: ListManagementReviewsPagedDocument,
  pagedKey: 'listManagementReviewsPaged',
});

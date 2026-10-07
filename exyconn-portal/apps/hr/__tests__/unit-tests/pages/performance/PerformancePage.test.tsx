import { describe, expect, it, vi } from 'vitest';
import {
  ListPerformanceReviewsPagedDocument,
  ReviewStatus,
} from '@exyconn/shell/graphql/generated';
import { PerformancePage } from '../../../../src/pages/performance';
import { PERFORMANCE_REVIEW_COLUMNS } from '../../../../src/pages/performance/performance-review-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../harness/crud-dashboard';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPerformanceReviewsStatsQuery: () => gql.stats(),
  useDeletePerformanceReviewMutation: () => [gql.remove],
  useListUsersQuery: () => ({
    data: { listUsers: [{ id: 'user-1', name: 'Asha Rao', email: 'asha@example.com' }] },
  }),
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/performance/forms/performance-review', async () => ({
  PerformanceReviewForm: (await import('../../harness/form-stub')).FormStub,
}));

const row = {
  id: 'review-3',
  employeeId: 'user-1',
  cycle: 'FY26 H1',
  selfAssessment: 'Shipped the tracker',
  managerAssessment: 'Strong half',
  competencies: 'Ownership',
  score: 8,
  rating: 'Exceeds',
  actionPlan: 'Lead the next release',
  status: ReviewStatus.Open,
  updatedAt: '2026-03-04T12:00:00.000Z',
};

describeCrudPage('PerformancePage', {
  page: <PerformancePage />,
  mocks: gql,
  statsKey: 'listPerformanceReviewsStats',
  stats: tableStats(9, { status: { OPEN: 4, SELF_SUBMITTED: 3, CLOSED: 2 } }),
  lines: ['Reviews: 9', 'Open: 4', 'Self submitted: 3', 'Closed: 2'],
  emptyLines: ['Reviews: 0', 'Open: 0', 'Self submitted: 0', 'Closed: 0'],
  document: ListPerformanceReviewsPagedDocument,
  pageKey: 'listPerformanceReviewsPaged',
  columns: PERFORMANCE_REVIEW_COLUMNS,
  meta: {
    title: 'Performance',
    exportFileName: 'appraisals',
    entityLabel: 'review',
    searchPlaceholder: 'Search reviews…',
  },
  row,
  confirm: 'Delete this review?',
  entity: 'PerformanceReview',
});

describe('PerformancePage employee names', () => {
  it('hands the grid a lookup from employee id to name', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<PerformancePage />);

    expect(dashboardProps().context.nameOf?.('user-1')).toBe('Asha Rao');
    expect(dashboardProps().context.nameOf?.('user-gone')).toBe('user-gone');
  });
});

describe('PERFORMANCE_REVIEW_COLUMNS', () => {
  it('lays out employee, cycle, rating, status and update date, then edit and delete', () => {
    expect(columnIds(PERFORMANCE_REVIEW_COLUMNS)).toEqual([
      'employeeName',
      'cycle',
      'rating',
      'status',
      'updatedAt',
      'actions',
    ]);
    expect(actionKeys(PERFORMANCE_REVIEW_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it("names the employee through the grid's lookup", () => {
    const nameOf = (id: string) => (id === 'user-1' ? 'Asha Rao' : id);

    expect(formatCell(PERFORMANCE_REVIEW_COLUMNS, 'employeeName', row, { nameOf })).toBe(
      'Asha Rao',
    );
  });
});

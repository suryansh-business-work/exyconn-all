import { vi } from 'vitest';
import { ListLeavePoliciesPagedDocument } from '@exyconn/shell/graphql/generated';
import { LeavePoliciesPage } from '../../../../src/pages/leave-policies';
import { LEAVE_POLICY_COLUMNS } from '../../../../src/pages/leave-policies/leave-policy-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListLeavePoliciesStatsQuery: () => gql.stats(),
  useDeleteLeavePolicyMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/leave-policies/forms/leave-policy', async () => ({
  LeavePolicyForm: (await import('../../harness/form-stub')).FormStub,
}));

describeCrudPage('LeavePoliciesPage', {
  page: <LeavePoliciesPage />,
  mocks: gql,
  statsKey: 'listLeavePoliciesStats',
  stats: {
    ...tableStats(6, { active: { true: 4, false: 2 } }),
    sums: [{ field: 'annualQuota', total: 57 }],
  },
  lines: ['Policies: 6', 'Active: 4', 'Inactive: 2', 'Total quota: 57'],
  emptyLines: ['Policies: 0', 'Active: 0', 'Inactive: 0', 'Total quota: 0'],
  document: ListLeavePoliciesPagedDocument,
  pageKey: 'listLeavePoliciesPaged',
  columns: LEAVE_POLICY_COLUMNS,
  meta: {
    title: 'Leave types',
    exportFileName: 'leave-types',
    entityLabel: 'leave type',
    searchPlaceholder: 'Search leave types…',
  },
  row: { id: 'policy-3', name: 'Sick leave', code: 'SICK' },
  confirm: 'Delete this leave type?',
  entity: 'LeavePolicy',
});

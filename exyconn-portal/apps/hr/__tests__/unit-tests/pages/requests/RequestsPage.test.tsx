import { describe, expect, it, vi } from 'vitest';
import {
  ListEmployeeRequestsPagedDocument,
  RequestStatus,
  RequestType,
} from '@exyconn/shell/graphql/generated';
import { RequestsPage } from '../../../../src/pages/requests';
import { EMPLOYEE_REQUEST_COLUMNS } from '../../../../src/pages/requests/employee-request-grid';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';
import { actionKeys, columnIds } from '../../harness/grid';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmployeeRequestsStatsQuery: () => gql.stats(),
  useDeleteEmployeeRequestMutation: () => [gql.remove],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../harness/crud-dashboard');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/requests/forms/employee-request', async () => ({
  EmployeeRequestForm: (await import('../../harness/form-stub')).FormStub,
}));

const row = {
  id: 'request-5',
  employeeId: 'user-1',
  type: RequestType.Wfh,
  subject: 'Work from home on Friday',
  details: 'Plumber visiting',
  status: RequestStatus.Pending,
  decisionNote: null,
  decidedAt: null,
  createdAt: '2026-03-04T12:00:00.000Z',
};

describeCrudPage('RequestsPage', {
  page: <RequestsPage />,
  mocks: gql,
  statsKey: 'listEmployeeRequestsStats',
  stats: tableStats(12, { status: { PENDING: 5, APPROVED: 4, REJECTED: 3 } }),
  lines: ['Requests: 12', 'Pending: 5', 'Approved: 4', 'Rejected: 3'],
  emptyLines: ['Requests: 0', 'Pending: 0', 'Approved: 0', 'Rejected: 0'],
  document: ListEmployeeRequestsPagedDocument,
  pageKey: 'listEmployeeRequestsPaged',
  columns: EMPLOYEE_REQUEST_COLUMNS,
  meta: {
    title: 'Employee Requests',
    exportFileName: 'employee-requests',
    entityLabel: 'request',
    searchPlaceholder: 'Search requests…',
  },
  row,
  confirm: 'Delete this request?',
  entity: 'EmployeeRequest',
});

describe('EMPLOYEE_REQUEST_COLUMNS', () => {
  it('lays out subject, type, status and the date raised, then edit and delete', () => {
    expect(columnIds(EMPLOYEE_REQUEST_COLUMNS)).toEqual([
      'subject',
      'type',
      'status',
      'createdAt',
      'actions',
    ]);
    expect(actionKeys(EMPLOYEE_REQUEST_COLUMNS)).toEqual(['edit', 'delete']);
  });
});

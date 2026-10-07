import { describe, expect, it, vi } from 'vitest';
import { BenefitKind, ListBenefitsPagedDocument } from '@exyconn/shell/graphql/generated';
import { BenefitsPage } from '../../../../src/pages/benefits';
import { BENEFIT_COLUMNS } from '../../../../src/pages/benefits/benefit-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../harness/crud-dashboard';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListBenefitsStatsQuery: () => gql.stats(),
  useDeleteBenefitMutation: () => [gql.remove],
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

vi.mock('../../../../src/pages/benefits/forms/benefit', async () => ({
  BenefitForm: (await import('../../harness/form-stub')).FormStub,
}));

const row = {
  id: 'benefit-7',
  employeeId: 'user-1',
  kind: BenefitKind.Insurance,
  name: 'Health cover',
  provider: 'Acme Insurance',
  reference: 'POL-1',
  coverage: 'Family',
};

describeCrudPage('BenefitsPage', {
  page: <BenefitsPage />,
  mocks: gql,
  statsKey: 'listBenefitsStats',
  stats: tableStats(9, { kind: { INSURANCE: 4, PF: 3, WELLNESS: 1 } }),
  lines: ['Benefits: 9', 'Insurance: 4', 'PF: 3', 'Wellness: 1'],
  emptyLines: ['Benefits: 0', 'Insurance: 0', 'PF: 0', 'Wellness: 0'],
  document: ListBenefitsPagedDocument,
  pageKey: 'listBenefitsPaged',
  columns: BENEFIT_COLUMNS,
  meta: {
    title: 'Benefits',
    exportFileName: 'benefits',
    entityLabel: 'benefit',
    searchPlaceholder: 'Search benefits…',
  },
  row,
  confirm: 'Delete this benefit?',
  entity: 'Benefit',
});

describe('BenefitsPage employee names', () => {
  it('hands the grid a lookup from employee id to name', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<BenefitsPage />);

    expect(dashboardProps().context.nameOf?.('user-1')).toBe('Asha Rao');
    expect(dashboardProps().context.nameOf?.('user-gone')).toBe('user-gone');
  });
});

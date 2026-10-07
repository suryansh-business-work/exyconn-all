import { describe, expect, it, vi } from 'vitest';
import { DocumentKind, ListEmployeeDocumentsPagedDocument } from '@exyconn/shell/graphql/generated';
import { DocumentsPage } from '../../../../src/pages/documents';
import { EMPLOYEE_DOCUMENT_COLUMNS } from '../../../../src/pages/documents/employee-document-grid';
import { renderWithProviders } from '../../test-utils';
import { dashboardProps } from '../../harness/crud-dashboard';
import { tableStats } from '../../harness/crud-page';
import { describeCrudPage } from '../../harness/crud-page-suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmployeeDocumentsStatsQuery: () => gql.stats(),
  useDeleteEmployeeDocumentMutation: () => [gql.remove],
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

vi.mock('../../../../src/pages/documents/forms/employee-document', async () => ({
  EmployeeDocumentForm: (await import('../../harness/form-stub')).FormStub,
}));

const row = {
  id: 'doc-3',
  employeeId: 'user-1',
  kind: DocumentKind.OfferLetter,
  title: 'Offer letter',
  url: 'https://files.example.com/offer.pdf',
  issuedOn: '2026-01-05T00:00:00.000Z',
};

describeCrudPage('DocumentsPage', {
  page: <DocumentsPage />,
  mocks: gql,
  statsKey: 'listEmployeeDocumentsStats',
  stats: tableStats(12, { kind: { OFFER_LETTER: 5, TAX: 4, POLICY: 2 } }),
  lines: ['Documents: 12', 'Offer letters: 5', 'Tax: 4', 'Policy: 2'],
  emptyLines: ['Documents: 0', 'Offer letters: 0', 'Tax: 0', 'Policy: 0'],
  document: ListEmployeeDocumentsPagedDocument,
  pageKey: 'listEmployeeDocumentsPaged',
  columns: EMPLOYEE_DOCUMENT_COLUMNS,
  meta: {
    title: 'Employee Documents',
    exportFileName: 'employee-documents',
    entityLabel: 'document',
    searchPlaceholder: 'Search documents…',
  },
  row,
  confirm: 'Delete this document?',
  entity: 'EmployeeDocument',
});

describe('DocumentsPage employee names', () => {
  it('hands the grid a lookup from employee id to name', () => {
    gql.stats.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderWithProviders(<DocumentsPage />);

    expect(dashboardProps().context.nameOf?.('user-1')).toBe('Asha Rao');
  });
});

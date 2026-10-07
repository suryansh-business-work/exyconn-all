import { vi } from 'vitest';
import { ListFindingsPagedDocument } from '@exyconn/shell/graphql/generated';
import { FindingsPage } from '../../../../src/pages/findings';
import { FindingForm } from '../../../../src/pages/findings/forms/finding';
import { FINDING_COLUMNS } from '../../../../src/pages/findings/findings-grid';
import { findingRow } from '../compliance.fixtures';
import { describeCrudPage } from '../crud-page.suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListFindingsStatsQuery: gql.stats,
  useDeleteFindingMutation: () => [gql.remove],
}));

describeCrudPage({
  name: 'FindingsPage',
  Page: FindingsPage,
  Form: FindingForm,
  title: 'Findings & CAPA',
  entityLabel: 'finding',
  exportFileName: 'findings',
  label: 'Finding',
  columns: FINDING_COLUMNS,
  row: findingRow(),
  confirm: {
    message: 'Delete finding "{reference} — {title}"?',
    values: { reference: 'FND-0001', title: 'Leaver account still active' },
  },
  statsQuery: gql.stats,
  statsKey: 'listFindingsStats',
  totalLabel: 'Findings',
  buckets: [
    { label: 'Open', field: 'status', value: 'OPEN' },
    { label: 'Major', field: 'type', value: 'MAJOR_NONCONFORMITY' },
    { label: 'Closed', field: 'status', value: 'CLOSED' },
  ],
  deleteMutation: gql.remove,
  pagedDocument: ListFindingsPagedDocument,
  pagedKey: 'listFindingsPaged',
});

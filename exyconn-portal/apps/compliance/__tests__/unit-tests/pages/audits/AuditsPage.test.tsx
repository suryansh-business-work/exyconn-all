import { beforeEach, describe, it, vi } from 'vitest';
import { ListInternalAuditsPagedDocument } from '@exyconn/shell/graphql/generated';
import { AuditsPage } from '../../../../src/pages/audits';
import { AuditForm } from '../../../../src/pages/audits/forms/audit';
import { AUDIT_COLUMNS } from '../../../../src/pages/audits/audits-grid';
import { auditRow } from '../compliance.fixtures';
import { crudPageSuite } from '../crud-page.suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListInternalAuditsStatsQuery: gql.stats,
  useDeleteInternalAuditMutation: () => [gql.remove],
}));

const suite = crudPageSuite({
  name: 'AuditsPage',
  Page: AuditsPage,
  Form: AuditForm,
  title: 'Audits',
  entityLabel: 'audit',
  exportFileName: 'audit-programme',
  label: 'Audit',
  columns: AUDIT_COLUMNS,
  row: auditRow(),
  confirm: {
    message: 'Delete audit "{reference} — {title}"?',
    values: { reference: 'AUD-0001', title: 'Access control audit' },
  },
  statsQuery: gql.stats,
  statsKey: 'listInternalAuditsStats',
  totalLabel: 'Audits',
  buckets: [
    { label: 'Planned', field: 'status', value: 'PLANNED' },
    { label: 'In progress', field: 'status', value: 'IN_PROGRESS' },
    { label: 'Reported', field: 'status', value: 'REPORTED' },
  ],
  deleteMutation: gql.remove,
  pagedDocument: ListInternalAuditsPagedDocument,
  pagedKey: 'listInternalAuditsPaged',
});

describe('AuditsPage', () => {
  beforeEach(suite.setup);
  for (const [title, run] of suite.cases) {
    it(title, run);
  }
});

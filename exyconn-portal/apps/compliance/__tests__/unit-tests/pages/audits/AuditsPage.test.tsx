import { vi } from 'vitest';
import { ListInternalAuditsPagedDocument } from '@exyconn/shell/graphql/generated';
import { AuditsPage } from '../../../../src/pages/audits';
import { AuditForm } from '../../../../src/pages/audits/forms/audit';
import { AUDIT_COLUMNS } from '../../../../src/pages/audits/audits-grid';
import { auditRow } from '../compliance.fixtures';
import { describeCrudPage } from '../crud-page.suite';

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

describeCrudPage({
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

import { vi } from 'vitest';
import { ListRisksPagedDocument } from '@exyconn/shell/graphql/generated';
import { RisksPage } from '../../../../src/pages/risks';
import { RiskForm } from '../../../../src/pages/risks/forms/risk';
import { RISK_COLUMNS } from '../../../../src/pages/risks/risks-grid';
import { riskRow } from '../compliance.fixtures';
import { describeCrudPage } from '../crud-page.suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListRisksStatsQuery: gql.stats,
  useDeleteRiskMutation: () => [gql.remove],
}));

describeCrudPage({
  name: 'RisksPage',
  Page: RisksPage,
  Form: RiskForm,
  title: 'Risk register',
  entityLabel: 'risk',
  exportFileName: 'risk-register',
  label: 'Risk',
  columns: RISK_COLUMNS,
  row: riskRow(),
  confirm: {
    message: 'Delete risk "{reference} — {title}"?',
    values: { reference: 'RISK-0001', title: 'Laptop theft' },
  },
  statsQuery: gql.stats,
  statsKey: 'listRisksStats',
  totalLabel: 'Risks',
  buckets: [
    { label: 'Being treated', field: 'status', value: 'TREATING' },
    { label: 'Monitored', field: 'status', value: 'MONITORING' },
    { label: 'Closed', field: 'status', value: 'CLOSED' },
  ],
  deleteMutation: gql.remove,
  pagedDocument: ListRisksPagedDocument,
  pagedKey: 'listRisksPaged',
});

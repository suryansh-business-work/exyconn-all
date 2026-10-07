import { vi } from 'vitest';
import { ListObjectivesPagedDocument } from '@exyconn/shell/graphql/generated';
import { ObjectivesPage } from '../../../../src/pages/objectives';
import { ObjectiveForm } from '../../../../src/pages/objectives/forms/objective';
import { OBJECTIVE_COLUMNS } from '../../../../src/pages/objectives/objectives-grid';
import { objectiveRow } from '../compliance.fixtures';
import { describeCrudPage } from '../crud-page.suite';

const gql = vi.hoisted(() => ({ stats: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/crud', async () => (await import('../crud-page.mocks')).crudModuleMock());
vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../crud-page.mocks')).settingsModuleMock(),
);
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListObjectivesStatsQuery: gql.stats,
  useDeleteObjectiveMutation: () => [gql.remove],
}));

describeCrudPage({
  name: 'ObjectivesPage',
  Page: ObjectivesPage,
  Form: ObjectiveForm,
  title: 'Objectives',
  entityLabel: 'objective',
  exportFileName: 'objectives',
  label: 'Objective',
  columns: OBJECTIVE_COLUMNS,
  row: objectiveRow(),
  confirm: { message: 'Delete objective "{title}"?', values: { title: 'Fewer complaints' } },
  statsQuery: gql.stats,
  statsKey: 'listObjectivesStats',
  totalLabel: 'Objectives',
  buckets: [
    { label: 'On track', field: 'status', value: 'ON_TRACK' },
    { label: 'At risk', field: 'status', value: 'AT_RISK' },
    { label: 'Met', field: 'status', value: 'MET' },
  ],
  deleteMutation: gql.remove,
  pagedDocument: ListObjectivesPagedDocument,
  pagedKey: 'listObjectivesPaged',
});

import { beforeEach, describe, it, vi } from 'vitest';
import { PexelsConfigsPanel } from '../../../../src/pages/environment-variables/PexelsConfigsPanel';
import { configPanelSuite } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPexelsConfigsQuery: gql.list,
  useDeletePexelsConfigMutation: () => [gql.remove],
  useTestPexelsConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/pexels-config', async () =>
  (await import('./panel.harness')).formModule('PexelsConfigForm'),
);

const suite = configPanelSuite({
  name: 'PexelsConfigsPanel',
  Panel: PexelsConfigsPanel,
  listQuery: gql.list,
  listKey: 'listPexelsConfigs',
  rows: [
    { id: 'px-1', label: 'Stock', hasApiKey: true, apiKeyHint: 'p3x3', isActive: true },
    { id: 'px-2', label: 'Spare', hasApiKey: true, apiKeyHint: null, isActive: false },
  ],
  cells: {
    'px-1': ['Stock', '••••p3x3', 'ACTIVE'],
    'px-2': ['Spare', '••••', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Pexels config',
  confirm: 'Delete Pexels config "{label}"?',
  title: 'Pexels stock media',
  actionLabel: 'New Pexels config',
  emptyMessage: 'No Pexels configs yet.',
  form: 'PexelsConfigForm',
  newTitle: 'New Pexels config',
  editTitle: 'Edit Pexels config',
  backLabel: 'Back to Pexels stock media',
  connection: {
    ariaLabel: 'test pexels api key',
    mutation: gql.test,
    success: ['Pexels accepted the key on "{label}"', 'success', { label: 'Stock' }],
  },
});

describe('PexelsConfigsPanel', () => {
  beforeEach(suite.setup);
  for (const [title, run] of suite.cases) {
    it(title, run);
  }
});

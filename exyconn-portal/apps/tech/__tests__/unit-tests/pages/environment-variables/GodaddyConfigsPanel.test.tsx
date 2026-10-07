import { vi } from 'vitest';
import { GodaddyConfigsPanel } from '../../../../src/pages/environment-variables/GodaddyConfigsPanel';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListGodaddyConfigsQuery: gql.list,
  useDeleteGodaddyConfigMutation: () => [gql.remove],
  useTestGodaddyConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/godaddy-config', async () =>
  (await import('./panel.harness')).formModule('GodaddyConfigForm'),
);

describeConfigPanel({
  name: 'GodaddyConfigsPanel',
  Panel: GodaddyConfigsPanel,
  listQuery: gql.list,
  listKey: 'listGodaddyConfigs',
  rows: [
    {
      id: 'gd-1',
      label: 'Registrar',
      hasApiKey: true,
      apiKeyHint: 'ab12',
      hasApiSecret: true,
      isActive: true,
    },
    {
      id: 'gd-2',
      label: 'Old key',
      hasApiKey: false,
      apiKeyHint: null,
      hasApiSecret: false,
      isActive: false,
    },
  ],
  cells: {
    'gd-1': ['Registrar', '••••ab12', '••••', 'ACTIVE'],
    'gd-2': ['Old key', '—', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'GoDaddy config',
  confirm: 'Delete GoDaddy config "{label}"?',
  title: 'GoDaddy',
  actionLabel: 'New GoDaddy config',
  emptyMessage: 'No GoDaddy configs yet.',
  form: 'GodaddyConfigForm',
  newTitle: 'New GoDaddy config',
  editTitle: 'Edit GoDaddy config',
  backLabel: 'Back to GoDaddy',
  connection: {
    ariaLabel: 'test godaddy connection',
    mutation: gql.test,
    success: ['GoDaddy accepted the key on "{label}"', 'success', { label: 'Registrar' }],
  },
});

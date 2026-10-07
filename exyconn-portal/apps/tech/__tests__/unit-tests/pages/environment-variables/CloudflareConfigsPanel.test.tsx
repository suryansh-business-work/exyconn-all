import { vi } from 'vitest';
import { CloudflareConfigsPanel } from '../../../../src/pages/environment-variables/CloudflareConfigsPanel';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCloudflareConfigsQuery: gql.list,
  useDeleteCloudflareConfigMutation: () => [gql.remove],
  useTestCloudflareConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/cloudflare-config', async () =>
  (await import('./panel.harness')).formModule('CloudflareConfigForm'),
);

describeConfigPanel({
  name: 'CloudflareConfigsPanel',
  Panel: CloudflareConfigsPanel,
  listQuery: gql.list,
  listKey: 'listCloudflareConfigs',
  rows: [
    {
      id: 'cf-1',
      label: 'Main zone',
      accountId: 'acct-123',
      hasApiToken: true,
      apiTokenHint: 'k9Qz',
      isActive: true,
    },
    {
      id: 'cf-2',
      label: 'Spare',
      accountId: 'acct-456',
      hasApiToken: false,
      apiTokenHint: null,
      isActive: false,
    },
  ],
  cells: {
    'cf-1': ['Main zone', 'acct-123', '••••k9Qz', 'ACTIVE'],
    'cf-2': ['Spare', 'acct-456', '—', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Cloudflare config',
  confirm: 'Delete Cloudflare config "{label}"?',
  title: 'Cloudflare',
  actionLabel: 'New Cloudflare config',
  emptyMessage: 'No Cloudflare configs yet.',
  form: 'CloudflareConfigForm',
  newTitle: 'New Cloudflare config',
  editTitle: 'Edit Cloudflare config',
  backLabel: 'Back to Cloudflare',
  connection: {
    ariaLabel: 'test cloudflare connection',
    mutation: gql.test,
    success: ['Cloudflare accepted the token on "{label}"', 'success', { label: 'Main zone' }],
  },
});

import { vi } from 'vitest';
import { OpenAiConfigsPanel } from '../../../../src/pages/environment-variables/OpenAiConfigsPanel';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListOpenAiConfigsQuery: gql.list,
  useDeleteOpenAiConfigMutation: () => [gql.remove],
  useTestOpenAiConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/openai-config', async () =>
  (await import('./panel.harness')).formModule('OpenAiConfigForm'),
);

describeConfigPanel({
  name: 'OpenAiConfigsPanel',
  Panel: OpenAiConfigsPanel,
  listQuery: gql.list,
  listKey: 'listOpenAiConfigs',
  rows: [
    {
      id: 'oa-1',
      label: 'Production',
      hasApiKey: true,
      apiKeyHint: 'x7y8',
      defaultModel: 'gpt-4o-mini',
      isActive: true,
    },
    {
      id: 'oa-2',
      label: 'Unset',
      hasApiKey: false,
      apiKeyHint: null,
      defaultModel: 'gpt-4o',
      isActive: false,
    },
  ],
  cells: {
    'oa-1': ['Production', '••••x7y8', 'gpt-4o-mini', 'ACTIVE'],
    'oa-2': ['Unset', '—', 'gpt-4o', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'OpenAI config',
  confirm: 'Delete OpenAI config "{label}"?',
  title: 'OpenAI',
  actionLabel: 'New OpenAI config',
  emptyMessage: 'No OpenAI configs yet.',
  form: 'OpenAiConfigForm',
  newTitle: 'New OpenAI config',
  editTitle: 'Edit OpenAI config',
  backLabel: 'Back to OpenAI',
  connection: {
    ariaLabel: 'test openai api key',
    mutation: gql.test,
    success: [
      'OpenAI accepted the key on "{label}" for {model}',
      'success',
      { label: 'Production', model: 'gpt-4o-mini' },
    ],
  },
});

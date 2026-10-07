import { vi } from 'vitest';
import { GithubConfigsPanel } from '../../../../src/pages/environment-variables/GithubConfigsPanel';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListGithubConfigsQuery: gql.list,
  useDeleteGithubConfigMutation: () => [gql.remove],
  useTestGithubConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/github-config', async () =>
  (await import('./panel.harness')).formModule('GithubConfigForm'),
);

describeConfigPanel({
  name: 'GithubConfigsPanel',
  Panel: GithubConfigsPanel,
  listQuery: gql.list,
  listKey: 'listGithubConfigs',
  rows: [
    {
      id: 'gh-1',
      label: 'Tracker repo',
      owner: 'exyconn',
      repo: 'tracker',
      hasToken: true,
      tokenHint: 'f00d',
      isActive: true,
    },
    {
      id: 'gh-2',
      label: 'Fork',
      owner: 'someone',
      repo: 'fork',
      hasToken: true,
      tokenHint: null,
      isActive: false,
    },
  ],
  cells: {
    'gh-1': ['Tracker repo', 'exyconn/tracker', '••••f00d', 'ACTIVE'],
    'gh-2': ['Fork', 'someone/fork', '••••', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'GitHub config',
  confirm: 'Delete GitHub config "{label}"?',
  title: 'GitHub repository',
  actionLabel: 'New GitHub config',
  emptyMessage: 'No GitHub configs yet.',
  form: 'GithubConfigForm',
  newTitle: 'New GitHub config',
  editTitle: 'Edit GitHub config',
  backLabel: 'Back to GitHub repository',
  connection: {
    ariaLabel: 'test github connection',
    mutation: gql.test,
    success: [
      'Reached {repo} and found the tracker workflow',
      'success',
      { repo: 'exyconn/tracker' },
    ],
  },
});

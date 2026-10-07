import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SonarConfigsPanel } from '../../../../src/pages/environment-variables/SonarConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';
import { notify, resetHarness, table } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSonarConfigsQuery: gql.list,
  useDeleteSonarConfigMutation: () => [gql.remove],
  useTestSonarConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/sonar-config', async () =>
  (await import('./panel.harness')).formModule('SonarConfigForm'),
);

const ROWS = [
  {
    id: 'sq-1',
    label: 'SonarCloud',
    hostUrl: 'https://sonarcloud.example.test',
    projectKey: 'exyconn_all',
    organization: 'exyconn',
    hasToken: true,
    tokenHint: 'wxyz',
    isActive: true,
  },
  {
    id: 'sq-2',
    label: 'Self-hosted',
    hostUrl: 'https://sonar.example.test',
    projectKey: 'legacy',
    organization: '',
    hasToken: false,
    tokenHint: null,
    isActive: false,
  },
];

const outcome = (ok: boolean, message: string) => ({
  data: { testSonarConnection: { ok, message } },
});

describeConfigPanel({
  name: 'SonarConfigsPanel',
  Panel: SonarConfigsPanel,
  listQuery: gql.list,
  listKey: 'listSonarConfigs',
  rows: ROWS,
  cells: {
    'sq-1': ['SonarCloud', 'https://sonarcloud.example.test', 'exyconn_all', 'exyconn', '••••wxyz'],
    'sq-2': ['Self-hosted', 'legacy', '—', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'SonarQube config',
  confirm: 'Delete SonarQube config "{label}"?',
  title: 'SonarQube',
  actionLabel: 'New SonarQube config',
  emptyMessage: 'No SonarQube configs yet.',
  form: 'SonarConfigForm',
  newTitle: 'New SonarQube config',
  editTitle: 'Edit SonarQube config',
  backLabel: 'Back to SonarQube',
  connection: {
    ariaLabel: 'test sonarqube connection',
    mutation: gql.test,
    result: outcome(true, 'Connected to SonarQube and found the project.'),
    success: ['Connected to SonarQube and found the project.', 'success'],
  },
});

describe('SonarConfigsPanel test outcomes', () => {
  const refetch = vi.fn(async () => undefined);

  beforeEach(() => {
    resetHarness();
    gql.test.mockReset();
    gql.list.mockReturnValue({ data: { listSonarConfigs: ROWS }, loading: true, refetch });
  });

  const runTest = async () => {
    renderWithProviders(<SonarConfigsPanel />);
    const row = within(screen.getByTestId('row-sq-2'));
    await userEvent.click(row.getByRole('button', { name: 'test sonarqube connection' }));
  };

  it('keeps showing the rows it has while the list reloads', () => {
    renderWithProviders(<SonarConfigsPanel />);
    expect(table.props?.loading).toBe(false);
  });

  it("reports SonarQube's own reason when it refuses the token", async () => {
    gql.test.mockResolvedValue(outcome(false, 'SonarQube did not accept the token.'));
    await runTest();
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('SonarQube did not accept the token.', 'error'),
    );
    expect(gql.test).toHaveBeenCalledWith({ variables: { id: 'sq-2' } });
  });

  it('says nothing when the test came back without an outcome', async () => {
    gql.test.mockResolvedValue({ data: null });
    await runTest();
    await waitFor(() => expect(gql.test).toHaveBeenCalledTimes(1));
    expect(notify).not.toHaveBeenCalled();
  });
});

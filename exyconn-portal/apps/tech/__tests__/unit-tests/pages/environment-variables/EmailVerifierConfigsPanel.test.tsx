import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailVerifierConfigsPanel } from '../../../../src/pages/environment-variables/EmailVerifierConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { configPanelSuite } from './config-panel.suite';
import { notify, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useEmailVerifierConfigsQuery: gql.list,
  useDeleteEmailVerifierConfigMutation: () => [gql.remove],
  useTestEmailVerifierConfigMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/email-verifier-config', async () =>
  (await import('./panel.harness')).formModule('EmailVerifierConfigForm'),
);

const rows = [
  {
    id: 'ev-1',
    label: 'Port 25 proxy',
    proxyHost: 'proxy.example.com',
    proxyPort: 1080,
    proxyUsername: 'checker',
    hasProxyPassword: true,
    isActive: true,
  },
  {
    id: 'ev-2',
    label: 'No proxy',
    proxyHost: '',
    proxyPort: 1080,
    proxyUsername: '',
    hasProxyPassword: false,
    isActive: false,
  },
];

const suite = configPanelSuite({
  name: 'EmailVerifierConfigsPanel',
  Panel: EmailVerifierConfigsPanel,
  listQuery: gql.list,
  listKey: 'emailVerifierConfigs',
  rows,
  cells: {
    'ev-1': ['Port 25 proxy', 'proxy.example.com:1080', 'checker', '••••', 'ACTIVE'],
    'ev-2': ['No proxy', '—', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Email verifier config',
  confirm: 'Delete email verifier config "{label}"?',
  title: 'Email verifier',
  actionLabel: 'New email verifier config',
  emptyMessage: 'No proxy yet: checks run without one.',
  form: 'EmailVerifierConfigForm',
  newTitle: 'New email verifier config',
  editTitle: 'Edit email verifier config',
  backLabel: 'Back to Email verifier',
  connection: {
    ariaLabel: 'test email verifier proxy',
    mutation: gql.test,
    result: { data: { testEmailVerifierConfig: 'Reached gmail-smtp-in.l.google.com:25' } },
    success: ['Reached gmail-smtp-in.l.google.com:25', 'success'],
  },
});

describe('EmailVerifierConfigsPanel', () => {
  beforeEach(suite.setup);
  for (const [title, run] of suite.cases) {
    it(title, run);
  }
});

describe('EmailVerifierConfigsPanel test action', () => {
  const refetch = vi.fn(() => Promise.resolve(undefined));
  const renderPanel = () => {
    resetHarness();
    gql.test.mockReset();
    gql.list.mockReturnValue({ data: { emailVerifierConfigs: rows }, loading: false, refetch });
    renderWithProviders(<EmailVerifierConfigsPanel />);
  };

  it('has nothing to test on a config without a proxy host', () => {
    renderPanel();
    const cells = within(screen.getByTestId('row-ev-2'));
    expect(cells.getAllByText('—')).toHaveLength(3);
    expect(
      cells.queryByRole('button', { name: 'test email verifier proxy' }),
    ).not.toBeInTheDocument();
  });

  it('says the proxy answered when the server gives no detail', async () => {
    renderPanel();
    gql.test.mockResolvedValue({});
    const cells = within(screen.getByTestId('row-ev-1'));
    await userEvent.click(cells.getByRole('button', { name: 'test email verifier proxy' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('The proxy answered', 'success'));
  });
});

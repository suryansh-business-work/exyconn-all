import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirecrawlConfigsPanel } from '../../../../src/pages/environment-variables/FirecrawlConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';
import { notify, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useFirecrawlConfigsQuery: gql.list,
  useDeleteFirecrawlConfigMutation: () => [gql.remove],
  useTestFirecrawlConfigMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/firecrawl-config', async () => ({
  ...(await import('./panel.harness')).formModule('FirecrawlConfigForm'),
  isHostedFirecrawl: (
    await vi.importActual<
      typeof import('../../../../src/pages/environment-variables/forms/firecrawl-config/firecrawl-config.types')
    >('../../../../src/pages/environment-variables/forms/firecrawl-config/firecrawl-config.types')
  ).isHostedFirecrawl,
}));

const rows = [
  {
    id: 'fc-1',
    label: 'Hosted',
    baseUrl: 'https://api.firecrawl.dev',
    hasApiKey: true,
    apiKeyHint: 'Ab12',
    isActive: true,
  },
  {
    id: 'fc-2',
    label: 'Own install',
    baseUrl: 'http://firecrawl.internal:3002',
    hasApiKey: false,
    apiKeyHint: null,
    isActive: false,
  },
  {
    id: 'fc-3',
    label: 'Hosted, no key',
    baseUrl: 'https://api.firecrawl.dev',
    hasApiKey: false,
    apiKeyHint: null,
    isActive: true,
  },
];

describeConfigPanel({
  name: 'FirecrawlConfigsPanel',
  Panel: FirecrawlConfigsPanel,
  listQuery: gql.list,
  listKey: 'firecrawlConfigs',
  rows,
  cells: {
    'fc-1': ['Hosted', 'https://api.firecrawl.dev', '••••Ab12', 'ACTIVE'],
    'fc-2': ['Own install', 'http://firecrawl.internal:3002', 'No key (self-hosted)', 'INACTIVE'],
    'fc-3': ['Hosted, no key', '—', 'ACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Firecrawl config',
  confirm: 'Delete Firecrawl config "{label}"?',
  title: 'Firecrawl',
  actionLabel: 'New Firecrawl config',
  emptyMessage: 'No Firecrawl config yet: the CRM website scraper is off.',
  form: 'FirecrawlConfigForm',
  newTitle: 'New Firecrawl config',
  editTitle: 'Edit Firecrawl config',
  backLabel: 'Back to Firecrawl',
  connection: {
    ariaLabel: 'test firecrawl',
    mutation: gql.test,
    result: { data: { testFirecrawlConfig: 'Firecrawl scraped the test page' } },
    success: ['Firecrawl scraped the test page', 'success'],
  },
});

describe('FirecrawlConfigsPanel test action', () => {
  const refetch = vi.fn(async () => undefined);
  const renderPanel = () => {
    resetHarness();
    gql.test.mockReset();
    gql.list.mockReturnValue({ data: { firecrawlConfigs: rows }, loading: false, refetch });
    renderWithProviders(<FirecrawlConfigsPanel />);
  };

  it('offers a test for a keyless self-hosted install but not for the hosted API without a key', () => {
    renderPanel();
    const selfHosted = within(screen.getByTestId('row-fc-2'));
    expect(selfHosted.getByRole('button', { name: 'test firecrawl' })).toBeInTheDocument();
    const hostedNoKey = within(screen.getByTestId('row-fc-3'));
    expect(hostedNoKey.queryByRole('button', { name: 'test firecrawl' })).not.toBeInTheDocument();
  });

  it('says the key was accepted when the server gives no detail', async () => {
    renderPanel();
    gql.test.mockResolvedValue({});
    const cells = within(screen.getByTestId('row-fc-2'));
    await userEvent.click(cells.getByRole('button', { name: 'test firecrawl' }));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Firecrawl accepted the key', 'success'),
    );
    expect(gql.test).toHaveBeenCalledWith({ variables: { id: 'fc-2' } });
  });
});

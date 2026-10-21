import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleMapsConfigsPanel } from '../../../../src/pages/environment-variables/GoogleMapsConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { configPanelSuite } from './config-panel.suite';
import { notify, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGoogleMapsConfigsQuery: gql.list,
  useDeleteGoogleMapsConfigMutation: () => [gql.remove],
  useTestGoogleMapsConfigMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/google-maps-config', async () =>
  (await import('./panel.harness')).formModule('GoogleMapsConfigForm'),
);

const rows = [
  {
    id: 'gm-1',
    label: 'Production',
    hasBrowserKey: true,
    browserKeyHint: 'b123',
    hasServerKey: true,
    serverKeyHint: 's456',
    isActive: true,
  },
  {
    id: 'gm-2',
    label: 'Empty',
    hasBrowserKey: false,
    browserKeyHint: null,
    hasServerKey: false,
    serverKeyHint: null,
    isActive: false,
  },
];

const suite = configPanelSuite({
  name: 'GoogleMapsConfigsPanel',
  Panel: GoogleMapsConfigsPanel,
  listQuery: gql.list,
  listKey: 'googleMapsConfigs',
  rows,
  cells: {
    'gm-1': ['Production', '••••b123', '••••s456', 'ACTIVE'],
    'gm-2': ['Empty', '—', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Google Maps config',
  confirm: 'Delete Google Maps config "{label}"?',
  title: 'Google Maps',
  actionLabel: 'New Google Maps config',
  emptyMessage: 'No Google Maps keys yet: the lead generator and CRM maps are off.',
  form: 'GoogleMapsConfigForm',
  newTitle: 'New Google Maps config',
  editTitle: 'Edit Google Maps config',
  backLabel: 'Back to Google Maps',
  connection: {
    ariaLabel: 'test google places key',
    mutation: gql.test,
    result: { data: { testGoogleMapsConfig: 'Places found 20 results' } },
    success: ['Places found 20 results', 'success'],
  },
});

describe('GoogleMapsConfigsPanel', () => {
  beforeEach(suite.setup);
  for (const [title, run] of suite.cases) {
    it(title, run);
  }
});

describe('GoogleMapsConfigsPanel test action', () => {
  const refetch = vi.fn(() => Promise.resolve(undefined));
  const renderPanel = () => {
    resetHarness();
    gql.test.mockReset();
    gql.list.mockReturnValue({ data: { googleMapsConfigs: rows }, loading: false, refetch });
    renderWithProviders(<GoogleMapsConfigsPanel />);
  };

  it('has no Places key to test on a config without a server key', () => {
    renderPanel();
    const cells = within(screen.getByTestId('row-gm-2'));
    expect(cells.getAllByText('—')).toHaveLength(2);
    expect(cells.queryByRole('button', { name: 'test google places key' })).not.toBeInTheDocument();
  });

  it('says Places accepted the key when the server gives no detail', async () => {
    renderPanel();
    gql.test.mockResolvedValue({});
    const cells = within(screen.getByTestId('row-gm-1'));
    await userEvent.click(cells.getByRole('button', { name: 'test google places key' }));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Google Places accepted the key', 'success'),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingKeysPanel } from '../../../../src/pages/environment-variables/BillingKeysPanel';
import { renderWithProviders } from '../../test-utils';
import { configPanelSuite } from './config-panel.suite';
import { notify, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useBillingKeyConfigsQuery: gql.list,
  useDeleteBillingKeyConfigMutation: () => [gql.remove],
  useTestBillingKeyConfigMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/billing-key-config', async () =>
  (await import('./panel.harness')).formModule('BillingKeyConfigForm'),
);

const rows = [
  {
    id: 'bk-1',
    provider: 'OPENAI',
    label: 'Billing',
    hasKey: true,
    keyHint: 'Wx9z',
    isActive: true,
  },
  { id: 'bk-2', provider: 'OPENAI', label: 'Old', hasKey: true, keyHint: null, isActive: false },
];

const suite = configPanelSuite({
  name: 'BillingKeysPanel',
  Panel: BillingKeysPanel,
  listQuery: gql.list,
  listKey: 'billingKeyConfigs',
  rows,
  cells: {
    'bk-1': ['Billing', 'OPENAI', '••••Wx9z', 'ACTIVE'],
    'bk-2': ['Old', 'OPENAI', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Billing key',
  confirm: 'Delete billing key "{label}"?',
  title: 'Billing keys',
  actionLabel: 'New billing key',
  emptyMessage: 'No billing key yet: dashboards show the cost estimated from our own calls.',
  form: 'BillingKeyConfigForm',
  newTitle: 'New billing key',
  editTitle: 'Edit billing key',
  backLabel: 'Back to Billing keys',
  connection: {
    ariaLabel: 'test billing key',
    mutation: gql.test,
    result: { data: { testBillingKeyConfig: 'The key works' } },
    success: ['The key works', 'success'],
  },
});

describe('BillingKeysPanel', () => {
  beforeEach(suite.setup);
  for (const [title, run] of suite.cases) {
    it(title, run);
  }
});

describe('BillingKeysPanel test action', () => {
  it('says the key works when the server gives no detail, and reports a refusal', async () => {
    resetHarness();
    gql.test.mockReset().mockResolvedValueOnce({}).mockRejectedValueOnce({});
    gql.list.mockReturnValue({
      data: { billingKeyConfigs: rows },
      loading: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<BillingKeysPanel />);
    const row = within(screen.getByTestId('row-bk-1'));
    await userEvent.click(row.getByRole('button', { name: 'test billing key' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('The billing key works', 'success'));
    await userEvent.click(row.getByRole('button', { name: 'test billing key' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Connection failed', 'error'));
  });
});

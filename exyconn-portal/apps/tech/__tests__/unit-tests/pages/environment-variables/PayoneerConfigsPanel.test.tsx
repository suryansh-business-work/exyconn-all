import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { env } from '@exyconn/shell/config/env';
import { PayoneerConfigsPanel } from '../../../../src/pages/environment-variables/PayoneerConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPayoneerConfigsQuery: gql.list,
  useDeletePayoneerConfigMutation: () => [gql.remove],
  useTestPayoneerConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/payoneer-config', async () =>
  (await import('./panel.harness')).formModule('PayoneerConfigForm'),
);

const ROWS = [
  {
    id: 'po-1',
    label: 'Global',
    merchantCode: 'EXY-MERCHANT',
    hasApiToken: true,
    apiTokenHint: 'po77',
    division: 'Services',
    mode: 'LIVE',
    isActive: true,
  },
  {
    id: 'po-2',
    label: 'Testing',
    merchantCode: 'EXY-TEST',
    hasApiToken: false,
    apiTokenHint: null,
    division: '',
    mode: 'SANDBOX',
    isActive: false,
  },
];

describeConfigPanel({
  name: 'PayoneerConfigsPanel',
  Panel: PayoneerConfigsPanel,
  listQuery: gql.list,
  listKey: 'listPayoneerConfigs',
  rows: ROWS,
  cells: {
    'po-1': ['Global', 'EXY-MERCHANT', '••••po77', 'Services', 'LIVE', 'ACTIVE'],
    'po-2': ['Testing', 'EXY-TEST', '—', 'SANDBOX', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Payoneer account',
  confirm: 'Delete Payoneer account "{label}"?',
  title: 'Payoneer',
  actionLabel: 'New Payoneer account',
  emptyMessage: 'No Payoneer account yet.',
  form: 'PayoneerConfigForm',
  newTitle: 'New Payoneer account',
  editTitle: 'Edit Payoneer account',
  backLabel: 'Back to Payoneer',
  connection: {
    ariaLabel: 'test payoneer connection',
    mutation: gql.test,
    success: ['Payoneer accepted the credentials on "{label}"', 'success', { label: 'Global' }],
  },
});

describe('PayoneerConfigsPanel notification URL', () => {
  it('shows the address Payoneer is sent with every checkout', () => {
    gql.list.mockReturnValue({ data: { listPayoneerConfigs: ROWS }, loading: false });
    renderWithProviders(<PayoneerConfigsPanel />);
    expect(screen.getByText('Notification URL')).toBeInTheDocument();
    const url = new URL('/webhooks/payoneer', env.graphqlUrl).toString();
    expect(screen.getByText(url)).toBeInTheDocument();
    expect(screen.queryByText(/^Events:/)).not.toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { env } from '@exyconn/shell/config/env';
import { PaypalConfigsPanel } from '../../../../src/pages/environment-variables/PaypalConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListPaypalConfigsQuery: gql.list,
  useDeletePaypalConfigMutation: () => [gql.remove],
  useTestPaypalConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/paypal-config', async () =>
  (await import('./panel.harness')).formModule('PaypalConfigForm'),
);

const ROWS = [
  {
    id: 'pp-1',
    label: 'Checkout',
    clientId: 'client-live',
    hasClientSecret: true,
    clientSecretHint: 'cs99',
    webhookId: 'WH-1',
    mode: 'LIVE',
    isActive: true,
  },
  {
    id: 'pp-2',
    label: 'Sandbox app',
    clientId: 'client-sandbox',
    hasClientSecret: false,
    clientSecretHint: null,
    webhookId: 'WH-2',
    mode: 'SANDBOX',
    isActive: false,
  },
];

describeConfigPanel({
  name: 'PaypalConfigsPanel',
  Panel: PaypalConfigsPanel,
  listQuery: gql.list,
  listKey: 'listPaypalConfigs',
  rows: ROWS,
  cells: {
    'pp-1': ['Checkout', 'client-live', '••••cs99', 'WH-1', 'LIVE', 'ACTIVE'],
    'pp-2': ['Sandbox app', 'client-sandbox', '—', 'WH-2', 'SANDBOX', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'PayPal account',
  confirm: 'Delete PayPal account "{label}"?',
  title: 'PayPal',
  actionLabel: 'New PayPal account',
  emptyMessage: 'No PayPal account yet.',
  form: 'PaypalConfigForm',
  newTitle: 'New PayPal account',
  editTitle: 'Edit PayPal account',
  backLabel: 'Back to PayPal',
  connection: {
    ariaLabel: 'test paypal connection',
    mutation: gql.test,
    success: ['PayPal accepted the credentials on "{label}"', 'success', { label: 'Checkout' }],
  },
});

describe('PaypalConfigsPanel webhook', () => {
  it('shows the webhook to register and the events to subscribe it to', () => {
    gql.list.mockReturnValue({ data: { listPaypalConfigs: ROWS }, loading: false });
    renderWithProviders(<PaypalConfigsPanel />);
    expect(screen.getByText('Webhook to register')).toBeInTheDocument();
    const url = new URL('/webhooks/paypal', env.graphqlUrl).toString();
    expect(screen.getByText(url)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED, CHECKOUT.ORDER.VOIDED',
      ),
    ).toBeInTheDocument();
  });
});

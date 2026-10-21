import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { env } from '@exyconn/shell/config/env';
import { RazorpayConfigsPanel } from '../../../../src/pages/environment-variables/RazorpayConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { configPanelSuite } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListRazorpayConfigsQuery: gql.list,
  useDeleteRazorpayConfigMutation: () => [gql.remove],
  useTestRazorpayConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/razorpay-config', async () =>
  (await import('./panel.harness')).formModule('RazorpayConfigForm'),
);

const suite = configPanelSuite({
  name: 'RazorpayConfigsPanel',
  Panel: RazorpayConfigsPanel,
  listQuery: gql.list,
  listKey: 'listRazorpayConfigs',
  rows: [
    {
      id: 'rp-1',
      label: 'India',
      keyId: 'rzp_test_1',
      hasKeySecret: true,
      keySecretHint: 'aa11',
      hasWebhookSecret: true,
      webhookSecretHint: 'bb22',
      isActive: true,
    },
    {
      id: 'rp-2',
      label: 'Draft',
      keyId: 'rzp_test_2',
      hasKeySecret: false,
      keySecretHint: null,
      hasWebhookSecret: true,
      webhookSecretHint: null,
      isActive: false,
    },
  ],
  cells: {
    'rp-1': ['India', 'rzp_test_1', '••••aa11', '••••bb22', 'ACTIVE'],
    'rp-2': ['Draft', 'rzp_test_2', '—', '••••', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Razorpay account',
  confirm: 'Delete Razorpay account "{label}"?',
  title: 'Razorpay',
  actionLabel: 'New Razorpay account',
  emptyMessage: 'No Razorpay account yet.',
  form: 'RazorpayConfigForm',
  newTitle: 'New Razorpay account',
  editTitle: 'Edit Razorpay account',
  backLabel: 'Back to Razorpay',
  connection: {
    ariaLabel: 'test razorpay connection',
    mutation: gql.test,
    success: ['Razorpay accepted the keys on "{label}"', 'success', { label: 'India' }],
  },
});

describe('RazorpayConfigsPanel', () => {
  beforeEach(suite.setup);
  for (const [title, run] of suite.cases) {
    it(title, run);
  }
});

describe('RazorpayConfigsPanel webhook', () => {
  it('shows the webhook to register and the payment link events to subscribe it to', () => {
    gql.list.mockReturnValue({ data: { listRazorpayConfigs: [] }, loading: false });
    renderWithProviders(<RazorpayConfigsPanel />);
    expect(screen.getByText('Webhook to register')).toBeInTheDocument();
    const url = new URL('/webhooks/razorpay', env.graphqlUrl).toString();
    expect(screen.getByText(url)).toBeInTheDocument();
    expect(
      screen.getByText('Events: payment_link.paid, payment_link.expired, payment_link.cancelled'),
    ).toBeInTheDocument();
  });
});

import { vi } from 'vitest';
import { StripeConfigsPanel } from '../../../../src/pages/environment-variables/StripeConfigsPanel';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListStripeConfigsQuery: gql.list,
  useDeleteStripeConfigMutation: () => [gql.remove],
  useTestStripeConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/stripe-config', async () =>
  (await import('./panel.harness')).formModule('StripeConfigForm'),
);

describeConfigPanel({
  name: 'StripeConfigsPanel',
  Panel: StripeConfigsPanel,
  listQuery: gql.list,
  listKey: 'listStripeConfigs',
  rows: [
    {
      id: 'st-1',
      label: 'Cards',
      hasSecretKey: true,
      secretKeyHint: 'sk42',
      hasWebhookSecret: true,
      webhookSecretHint: 'wh42',
      isActive: true,
    },
    {
      id: 'st-2',
      label: 'Old',
      hasSecretKey: true,
      secretKeyHint: null,
      hasWebhookSecret: false,
      webhookSecretHint: null,
      isActive: false,
    },
  ],
  cells: {
    'st-1': ['Cards', '••••sk42', '••••wh42', 'ACTIVE'],
    'st-2': ['Old', '••••', '—', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Stripe account',
  confirm: 'Delete Stripe account "{label}"?',
  title: 'Stripe',
  actionLabel: 'New Stripe account',
  emptyMessage: 'No Stripe account yet.',
  form: 'StripeConfigForm',
  newTitle: 'New Stripe account',
  editTitle: 'Edit Stripe account',
  backLabel: 'Back to Stripe',
  connection: {
    ariaLabel: 'test stripe connection',
    mutation: gql.test,
    success: ['Stripe accepted the key on "{label}"', 'success', { label: 'Cards' }],
  },
});

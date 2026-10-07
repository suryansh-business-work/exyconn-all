import { vi } from 'vitest';
import { InboundMailConfigsPanel } from '../../../../src/pages/environment-variables/InboundMailConfigsPanel';
import { describeConfigPanel } from './config-panel.suite';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn(), test: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListInboundMailConfigsQuery: gql.list,
  useDeleteInboundMailConfigMutation: () => [gql.remove],
  useTestInboundMailConnectionMutation: () => [gql.test],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/inbound-mail-config', async () =>
  (await import('./panel.harness')).formModule('InboundMailConfigForm'),
);

describeConfigPanel({
  name: 'InboundMailConfigsPanel',
  Panel: InboundMailConfigsPanel,
  listQuery: gql.list,
  listKey: 'listInboundMailConfigs',
  rows: [
    {
      id: 'im-1',
      label: 'Support inbox',
      host: 'imap.example.test',
      port: 993,
      secure: true,
      user: 'support@example.test',
      mailbox: 'INBOX',
      pollSeconds: 60,
      deleteAfterImport: true,
      isActive: true,
    },
    {
      id: 'im-2',
      label: 'Archive',
      host: 'mail.example.test',
      port: 143,
      secure: false,
      user: 'archive@example.test',
      mailbox: 'Archive',
      pollSeconds: 300,
      deleteAfterImport: false,
      isActive: false,
    },
  ],
  cells: {
    'im-1': ['imap.example.test:993', 'support@example.test', 'INBOX', '60s', 'Yes', 'ACTIVE'],
    'im-2': ['mail.example.test:143', 'archive@example.test', '300s', 'No', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Inbound mail config',
  confirm: 'Delete inbound mailbox "{label}"?',
  title: 'Inbound mail',
  actionLabel: 'New inbound mailbox',
  emptyMessage: 'No inbound mailboxes yet.',
  form: 'InboundMailConfigForm',
  newTitle: 'New inbound mailbox',
  editTitle: 'Edit inbound mailbox',
  backLabel: 'Back to Inbound mail',
  connection: {
    ariaLabel: 'test inbound mail connection',
    mutation: gql.test,
    success: [
      'Signed in to {host} and opened {mailbox}',
      'success',
      { host: 'imap.example.test', mailbox: 'INBOX' },
    ],
  },
});

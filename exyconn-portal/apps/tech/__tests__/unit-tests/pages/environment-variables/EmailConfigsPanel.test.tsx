import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailConfigsPanel } from '../../../../src/pages/environment-variables/EmailConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';
import { forms, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmailConfigsQuery: gql.list,
  useDeleteEmailConfigMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/email-config', async () =>
  (await import('./panel.harness')).formModule('EmailConfigForm'),
);
vi.mock('../../../../src/pages/environment-variables/forms/send-test-email', async () =>
  (await import('./panel.harness')).formModule('SendTestEmailForm'),
);

const ROWS = [
  {
    id: 'em-1',
    label: 'Transactional',
    host: 'smtp.example.test',
    port: 587,
    secure: false,
    username: 'mailer',
    hasPassword: true,
    fromAddress: 'noreply@example.test',
    isActive: true,
  },
  {
    id: 'em-2',
    label: 'Backup relay',
    host: 'relay.example.test',
    port: 465,
    secure: true,
    username: 'relay',
    hasPassword: false,
    fromAddress: 'backup@example.test',
    isActive: false,
  },
];

describeConfigPanel({
  name: 'EmailConfigsPanel',
  Panel: EmailConfigsPanel,
  listQuery: gql.list,
  listKey: 'listEmailConfigs',
  rows: ROWS,
  cells: {
    'em-1': ['Transactional', 'smtp.example.test', 'noreply@example.test', 'ACTIVE'],
    'em-2': ['Backup relay', 'relay.example.test', 'backup@example.test', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Email config',
  confirm: 'Delete email config "{label}"?',
  title: 'Email configurations',
  actionLabel: 'New email config',
  emptyMessage: 'No email configs yet.',
  form: 'EmailConfigForm',
  newTitle: 'New email config',
  editTitle: 'Edit email config',
  backLabel: 'Back to Email configurations',
});

describe('EmailConfigsPanel test email', () => {
  beforeEach(() => {
    resetHarness();
    gql.list.mockReturnValue({ data: { listEmailConfigs: ROWS }, loading: false });
  });

  const openTest = async () => {
    renderWithProviders(<EmailConfigsPanel />);
    const row = within(screen.getByTestId('row-em-2'));
    await userEvent.click(row.getByRole('button', { name: 'send test email' }));
  };

  it('opens the test form on the chosen account, addressed to its own sender', async () => {
    await openTest();
    expect(await screen.findByRole('heading', { name: 'Send test email' })).toBeInTheDocument();
    expect(forms.SendTestEmailForm).toMatchObject({
      configId: 'em-2',
      configLabel: 'Backup relay',
      defaultTo: 'backup@example.test',
    });
  });

  it.each(['stub done', 'stub cancel'])('closes the test form on %s', async (button) => {
    await openTest();
    await userEvent.click(await screen.findByRole('button', { name: button }));
    await waitFor(() => expect(screen.queryByTestId('SendTestEmailForm')).not.toBeInTheDocument());
  });

  it('closes the test form from the panel close button', async () => {
    await openTest();
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByTestId('SendTestEmailForm')).not.toBeInTheDocument());
  });
});

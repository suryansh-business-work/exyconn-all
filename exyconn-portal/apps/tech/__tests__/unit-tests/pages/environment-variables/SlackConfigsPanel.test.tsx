import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlackConfigsPanel } from '../../../../src/pages/environment-variables/SlackConfigsPanel';
import { renderWithProviders } from '../../test-utils';
import { describeConfigPanel } from './config-panel.suite';
import { forms, resetHarness } from './panel.harness';

const gql = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSlackConfigsQuery: gql.list,
  useDeleteSlackConfigMutation: () => [gql.remove],
}));
vi.mock('@exyconn/crud', async () => (await import('./panel.harness')).crudModule());
vi.mock('@exyconn/shell/components/data/DataTable', async () =>
  (await import('./panel.harness')).dataTableModule(),
);
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) =>
  (await import('./panel.harness')).notifyModule(importOriginal),
);
vi.mock('../../../../src/pages/environment-variables/forms/slack-config', async () =>
  (await import('./panel.harness')).formModule('SlackConfigForm'),
);
vi.mock('../../../../src/pages/environment-variables/forms/send-test-slack', async () =>
  (await import('./panel.harness')).formModule('SendTestSlackForm'),
);

const ROWS = [
  {
    id: 'sl-1',
    label: 'Workspace',
    defaultChannel: '#alerts',
    hasBotToken: true,
    botTokenHint: 'b0t1',
    hasSigningSecret: true,
    isActive: true,
  },
  {
    id: 'sl-2',
    label: 'Legacy',
    defaultChannel: '#general',
    hasBotToken: false,
    botTokenHint: null,
    hasSigningSecret: false,
    isActive: false,
  },
];

describeConfigPanel({
  name: 'SlackConfigsPanel',
  Panel: SlackConfigsPanel,
  listQuery: gql.list,
  listKey: 'listSlackConfigs',
  rows: ROWS,
  cells: {
    'sl-1': ['Workspace', '#alerts', '••••b0t1', '••••', 'ACTIVE'],
    'sl-2': ['Legacy', '#general', '—', 'INACTIVE'],
  },
  deleteMutation: gql.remove,
  label: 'Slack config',
  confirm: 'Delete Slack config "{label}"?',
  title: 'Slack configurations',
  actionLabel: 'New Slack config',
  emptyMessage: 'No Slack configs yet.',
  form: 'SlackConfigForm',
  newTitle: 'New Slack config',
  editTitle: 'Edit Slack config',
  backLabel: 'Back to Slack configurations',
});

describe('SlackConfigsPanel test message', () => {
  beforeEach(() => {
    resetHarness();
    gql.list.mockReturnValue({ data: { listSlackConfigs: ROWS }, loading: false });
  });

  const openTest = async () => {
    renderWithProviders(<SlackConfigsPanel />);
    const row = within(screen.getByTestId('row-sl-1'));
    await userEvent.click(row.getByRole('button', { name: 'send test slack message' }));
  };

  it('opens the test form on the chosen workspace and its default channel', async () => {
    await openTest();
    expect(await screen.findByRole('heading', { name: 'Send test message' })).toBeInTheDocument();
    expect(forms.SendTestSlackForm).toMatchObject({
      configId: 'sl-1',
      configLabel: 'Workspace',
      defaultChannel: '#alerts',
    });
  });

  it.each(['stub done', 'stub cancel'])('closes the test form on %s', async (button) => {
    await openTest();
    await userEvent.click(await screen.findByRole('button', { name: button }));
    await waitFor(() => expect(screen.queryByTestId('SendTestSlackForm')).not.toBeInTheDocument());
  });

  it('closes the test form from the panel close button', async () => {
    await openTest();
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByTestId('SendTestSlackForm')).not.toBeInTheDocument());
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TrackerNotificationsForm,
  type TrackerNotificationsFormValues,
} from '../../../../../../src/pages/settings/forms/tracker-notifications';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ save: vi.fn(), notify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveTrackerBuildSettingsMutation: () => [gql.save],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));

const OPTIONS = [
  { value: 'C1', label: '#builds' },
  { value: 'C2', label: '#status' },
];
const NONE: TrackerNotificationsFormValues = { slackChannels: [], statusAlertChannels: [] };

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: TrackerNotificationsFormValues = NONE) =>
  renderWithProviders(
    <TrackerNotificationsForm
      options={OPTIONS}
      initial={initial}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );

const save = () => userEvent.click(screen.getByRole('button', { name: 'Save channels' }));

describe('TrackerNotificationsForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    gql.notify.mockReset();
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('explains which channels are offered and shows the ones already chosen', () => {
    renderForm({ slackChannels: ['C1'], statusAlertChannels: ['C2'] });
    expect(screen.getByText(/Every channel the Slack bot can see is listed/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Channels for tracker builds/ })).toHaveTextContent(
      '#builds',
    );
    expect(screen.getByRole('combobox', { name: /Status alerts/ })).toHaveTextContent('#status');
  });

  it('saves the chosen channels and hands control back', async () => {
    renderForm({ slackChannels: ['C1'], statusAlertChannels: ['C2'] });
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.save).toHaveBeenCalledWith({
      variables: { slackChannels: ['C1'], statusAlertChannels: ['C2'] },
    });
    expect(gql.notify).toHaveBeenCalledWith('Notification channels saved');
  });

  it('allows saving no channels at all', async () => {
    renderForm();
    await save();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.save).toHaveBeenCalledWith({
      variables: { slackChannels: [], statusAlertChannels: [] },
    });
  });

  it('saves channels picked from the list', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('combobox', { name: /Status alerts/ }));
    const listbox = screen.getByRole('listbox');
    await userEvent.click(within(listbox).getByRole('option', { name: '#builds' }));
    await userEvent.click(within(listbox).getByRole('option', { name: '#status' }));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await save();
    await waitFor(() =>
      expect(gql.save).toHaveBeenCalledWith({
        variables: { slackChannels: [], statusAlertChannels: ['C1', 'C2'] },
      }),
    );
  });

  it('reports a save that fails and stays open', async () => {
    gql.save.mockRejectedValueOnce(new Error('not_authed')).mockRejectedValueOnce(undefined);
    renderForm();
    await save();
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('not_authed', 'error'));
    await save();
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Could not save', 'error'));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.save).not.toHaveBeenCalled();
  });
});

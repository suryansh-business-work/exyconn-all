import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '../../../../src/pages/settings';
import { renderWithProviders } from '../../test-utils';
import { formRenders } from './settings.stubs';

const gql = vi.hoisted(() => ({ channels: vi.fn(), settings: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListSlackChannelsQuery: gql.channels,
  useTrackerBuildSettingsQuery: gql.settings,
}));
vi.mock('../../../../src/pages/settings/forms/tracker-notifications', async () => ({
  TrackerNotificationsForm: (await import('./settings.stubs')).TrackerNotificationsFormStub,
}));

const CHANNELS = [
  { id: 'C1', name: 'general', isPrivate: false, isMember: false },
  { id: 'C2', name: 'hr', isPrivate: true, isMember: true },
  { id: 'C3', name: 'secret', isPrivate: true, isMember: false },
];

const SAVED = {
  trackerBuildSettings: { slackChannels: ['C1'], statusAlertChannels: ['C2', 'C3'] },
};

function answer(channels: Record<string, unknown>, settings: Record<string, unknown>) {
  gql.channels.mockReturnValue({ data: undefined, loading: false, ...channels });
  gql.settings.mockReturnValue({
    data: undefined,
    loading: false,
    refetch: gql.refetch,
    ...settings,
  });
}

describe('SettingsPage', () => {
  beforeEach(() => {
    gql.channels.mockReset();
    gql.settings.mockReset();
    gql.refetch.mockReset().mockResolvedValue({});
    formRenders.mockReset();
  });

  it('waits for the channels and the saved settings', () => {
    answer({ loading: true }, { data: SAVED });
    const { unmount } = renderWithProviders(<SettingsPage />);
    expect(gql.channels).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(gql.settings).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByText('Loading channels…')).toBeInTheDocument();
    expect(formRenders).not.toHaveBeenCalled();
    unmount();
    answer({ data: { listSlackChannels: CHANNELS } }, { loading: true });
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('Loading channels…')).toBeInTheDocument();
  });

  it('offers every channel the bot can see, marking the private ones', () => {
    answer({ data: { listSlackChannels: CHANNELS } }, { data: SAVED });
    renderWithProviders(<SettingsPage />);
    const options = within(screen.getByRole('list', { name: 'channel options' })).getAllByRole(
      'listitem',
    );
    expect(options.map((option) => option.textContent)).toEqual([
      '#general',
      '#hr (private)',
      '#secret (private, needs /invite)',
    ]);
    expect(formRenders.mock.lastCall?.[0].options.map((option) => option.value)).toEqual([
      'C1',
      'C2',
      'C3',
    ]);
    expect(screen.queryByText('Loading channels…')).not.toBeInTheDocument();
  });

  it('starts the form from the saved channels', () => {
    answer({ data: { listSlackChannels: CHANNELS } }, { data: SAVED });
    renderWithProviders(<SettingsPage />);
    expect(formRenders.mock.lastCall?.[0].initial).toEqual({
      slackChannels: ['C1'],
      statusAlertChannels: ['C2', 'C3'],
    });
  });

  it('starts from no channels when nothing is saved yet', () => {
    answer({ data: { listSlackChannels: [] } }, { data: undefined });
    renderWithProviders(<SettingsPage />);
    expect(formRenders.mock.lastCall?.[0]).toMatchObject({
      options: [],
      initial: { slackChannels: [], statusAlertChannels: [] },
    });
  });

  it('shows why the channels could not be listed, and still offers the form', () => {
    answer({ error: new Error('missing_scope') }, { data: SAVED });
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText('missing_scope')).toBeInTheDocument();
    expect(formRenders.mock.lastCall?.[0].options).toEqual([]);
  });

  it('re-reads the saved settings after a save or a cancel', async () => {
    answer({ data: { listSlackChannels: CHANNELS } }, { data: SAVED });
    renderWithProviders(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Form done' }));
    await userEvent.click(screen.getByRole('button', { name: 'Form cancel' }));
    expect(gql.refetch).toHaveBeenCalledTimes(2);
  });

  it('translates the private-channel marks', () => {
    answer({ data: { listSlackChannels: CHANNELS } }, { data: SAVED });
    renderWithProviders(<SettingsPage />, {
      messages: { '#{name} (private)': '#{name} (privat)' },
    });
    expect(screen.getByText('#hr (privat)')).toBeInTheDocument();
  });
});

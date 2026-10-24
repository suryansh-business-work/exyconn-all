import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaReleaseChannel,
  useMaReleaseSettingsQuery,
  useMaReleaseSlackChannelsQuery,
  useMaStartExtensionBuildMutation,
  useMaUpdateReleaseRetentionMutation,
  useMaUpdateReleaseSettingsMutation,
} from '@exyconn/shell/graphql/generated';
import { ReleaseManagerActions } from '../../../src/releases/ReleaseManagerActions';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaStartExtensionBuildMutation: vi.fn(),
  useMaReleaseSettingsQuery: vi.fn(),
  useMaReleaseSlackChannelsQuery: vi.fn(),
  useMaUpdateReleaseSettingsMutation: vi.fn(),
  useMaUpdateReleaseRetentionMutation: vi.fn(),
}));

const startBuild = vi.fn();
const save = vi.fn();
const saveRetention = vi.fn();
const SETTINGS = {
  allowedRepository: 'acme/portal',
  slackChannelId: 'C1',
  slackChannelName: 'releases',
  notifyOnNewBuild: false,
  slackConfigured: true,
  keepLatestBuilds: 4,
  updatedByName: '',
  updatedAt: null,
};
const CHANNELS = [
  { id: 'C1', name: 'releases', isPrivate: false },
  { id: 'C2', name: 'qa', isPrivate: true },
];

function settings(patch: Partial<typeof SETTINGS> = {}) {
  vi.mocked(useMaReleaseSettingsQuery).mockReturnValue(
    queryResult({ maReleaseSettings: { ...SETTINGS, ...patch } }) as never,
  );
}

function slackChannels(result: ReturnType<typeof queryResult>) {
  vi.mocked(useMaReleaseSlackChannelsQuery).mockReturnValue(result as never);
}

beforeEach(() => {
  startBuild.mockReset().mockResolvedValue({ data: { maStartExtensionBuild: true } });
  save.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useMaStartExtensionBuildMutation).mockReturnValue(mutationTuple(startBuild) as never);
  vi.mocked(useMaUpdateReleaseSettingsMutation).mockReturnValue(mutationTuple(save) as never);
  saveRetention.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useMaUpdateReleaseRetentionMutation).mockReturnValue(
    mutationTuple(saveRetention) as never,
  );
  settings();
  slackChannels(queryResult({ maReleaseSlackChannels: CHANNELS }));
});

const openSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Release settings' }));
  return screen.findByRole('dialog');
};

describe('ReleaseManagerActions — build a new release', () => {
  it('starts the build on the channel chosen and says when it will arrive', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleaseManagerActions />);
    await user.click(screen.getByRole('button', { name: 'Build new release' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('combobox', { name: /^Release channel/ }));
    await user.click(await screen.findByRole('option', { name: 'Internal' }));
    await user.click(within(dialog).getByRole('button', { name: 'Start build' }));
    expect(startBuild).toHaveBeenCalledWith({ variables: { channel: MaReleaseChannel.Internal } });
    expect(
      await screen.findByText(
        'The build has started. In about ten minutes it appears here, waiting for approval.',
      ),
    ).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the dialog open when GitHub refuses the build, and cancels', async () => {
    const user = userEvent.setup();
    startBuild.mockRejectedValue(new Error('GitHub is not configured'));
    renderWithProviders(<ReleaseManagerActions />);
    await user.click(screen.getByRole('button', { name: 'Build new release' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Start build' }));
    expect(startBuild).toHaveBeenCalledWith({ variables: { channel: MaReleaseChannel.Stable } });
    expect(await screen.findByText('GitHub is not configured')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('ReleaseManagerActions — release settings', () => {
  it('reads the settings only while the dialog is open', () => {
    renderWithProviders(<ReleaseManagerActions />);
    expect(vi.mocked(useMaReleaseSettingsQuery).mock.lastCall?.[0]).toEqual({ skip: true });
    expect(vi.mocked(useMaReleaseSlackChannelsQuery).mock.lastCall?.[0]).toEqual({ skip: true });
  });

  it('saves the repository, the Slack channel and the QA post', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleaseManagerActions />);
    const dialog = await openSettings(user);
    expect(vi.mocked(useMaReleaseSlackChannelsQuery).mock.lastCall?.[0]).toEqual({ skip: false });
    const repository = within(dialog).getByRole('textbox', { name: /^GitHub repository/ });
    expect(repository).toHaveValue('acme/portal');
    expect(within(dialog).getByRole('combobox', { name: 'Slack channel' })).toHaveValue(
      '#releases',
    );
    await user.clear(repository);
    await user.type(repository, ' acme/other ');
    await user.click(within(dialog).getByRole('combobox', { name: 'Slack channel' }));
    expect(await screen.findByRole('option', { name: "Don't post to Slack" })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: '#qa' }));
    await user.click(
      within(dialog).getByRole('switch', { name: 'Also post when a new build arrives for QA' }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));
    expect(save).toHaveBeenCalledWith({
      variables: {
        input: { allowedRepository: 'acme/other', slackChannelId: 'C2', notifyOnNewBuild: true },
      },
    });
    expect(vi.mocked(useMaUpdateReleaseSettingsMutation).mock.lastCall?.[0]).toEqual({
      refetchQueries: ['MaReleaseSettings'],
    });
    expect(await screen.findByText('Release settings saved')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('refuses a repository that is missing or not owner/name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleaseManagerActions />);
    const dialog = await openSettings(user);
    const repository = within(dialog).getByRole('textbox', { name: /^GitHub repository/ });
    await user.clear(repository);
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));
    expect(await within(dialog).findByText('Enter the repository')).toBeInTheDocument();
    await user.type(repository, 'acme/portal/extra');
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));
    expect(
      await within(dialog).findByText('Enter it as owner/name, e.g. acme/portal'),
    ).toBeInTheDocument();
    await user.clear(repository);
    await user.type(repository, `${'a'.repeat(150)}/${'b'.repeat(60)}`);
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));
    expect(
      await within(dialog).findByText('Keep the repository under 200 characters'),
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it('keeps the settings open when saving fails, and cancels', async () => {
    const user = userEvent.setup();
    save.mockRejectedValue(
      new Error('That Slack channel is not visible to the Exyconn Slack app.'),
    );
    renderWithProviders(<ReleaseManagerActions />);
    const dialog = await openSettings(user);
    await user.click(within(dialog).getByRole('button', { name: 'Update' }));
    expect(
      await screen.findByText('That Slack channel is not visible to the Exyconn Slack app.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The settings form's Cancel; the retention form below has its own.
    await user.click(within(dialog).getAllByRole('button', { name: 'Cancel' })[0]);
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the newest builds the release manager sets, and reads the settings again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReleaseManagerActions />);
    const dialog = await openSettings(user);
    const field = within(dialog).getByLabelText(/^Builds to keep/);
    expect(field).toHaveValue(4);
    await user.clear(field);
    await user.type(field, '8');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() =>
      expect(saveRetention).toHaveBeenCalledWith({ variables: { keepLatestBuilds: 8 } }),
    );
    expect(vi.mocked(useMaUpdateReleaseRetentionMutation).mock.lastCall?.[0]).toEqual({
      refetchQueries: ['MaReleaseSettings'],
    });
  });

  it('says where to set Slack up when it is not, and offers no channel', async () => {
    const user = userEvent.setup();
    settings({ slackConfigured: false, slackChannelId: '' });
    slackChannels(queryResult(undefined));
    renderWithProviders(<ReleaseManagerActions />);
    const dialog = await openSettings(user);
    expect(vi.mocked(useMaReleaseSlackChannelsQuery).mock.lastCall?.[0]).toEqual({ skip: true });
    expect(within(dialog).getByText(/^Slack is not set up/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: 'Tech > Environment Variables > Slack' }),
    ).toHaveAttribute('href', expect.stringMatching(/\/tech\/environment-variables\/slack$/));
    expect(within(dialog).queryByRole('combobox', { name: 'Slack channel' })).toBeNull();
    expect(within(dialog).queryByRole('switch')).toBeNull();
  });

  it('offers no channel when the Slack app sees none', async () => {
    const user = userEvent.setup();
    slackChannels(queryResult({ maReleaseSlackChannels: [] }));
    renderWithProviders(<ReleaseManagerActions />);
    const dialog = await openSettings(user);
    expect(within(dialog).getByRole('textbox', { name: /^GitHub repository/ })).toBeVisible();
    expect(within(dialog).queryByRole('combobox', { name: 'Slack channel' })).toBeNull();
  });

  it('still edits the repository when the channels fail to load, with Retry', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn().mockResolvedValue({});
    slackChannels(queryResult(undefined, { error: new Error('Slack is down'), refetch }));
    renderWithProviders(<ReleaseManagerActions />);
    const dialog = await openSettings(user);
    expect(within(dialog).getByText('Slack is down')).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: /^GitHub repository/ })).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the settings loading, and failing with Retry', async () => {
    const user = userEvent.setup();
    vi.mocked(useMaReleaseSettingsQuery).mockReturnValue(
      queryResult(undefined, { loading: true }) as never,
    );
    const first = renderWithProviders(<ReleaseManagerActions />);
    const loading = await openSettings(user);
    expect(within(loading).queryByRole('textbox')).toBeNull();
    first.unmount();
    // Configured, but the channels are still on their way: the form waits for them.
    settings();
    slackChannels(queryResult(undefined, { loading: true }));
    const second = renderWithProviders(<ReleaseManagerActions />);
    expect(within(await openSettings(user)).queryByRole('textbox')).toBeNull();
    second.unmount();
    const refetch = vi.fn().mockResolvedValue({});
    vi.mocked(useMaReleaseSettingsQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('Settings down'), refetch }) as never,
    );
    renderWithProviders(<ReleaseManagerActions />);
    const failed = await openSettings(user);
    expect(within(failed).getByText('Settings down')).toBeInTheDocument();
    await user.click(within(failed).getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { MeetingSettingsPanel } from '../../../../src/pages/meetings/MeetingSettingsPanel';
import { renderWithProviders } from '../../test-utils';
import { answered, pending } from '../../fixtures';
import { settingsRow } from './meetings-fixtures';

const gql = vi.hoisted(() => ({ settings: vi.fn(), slack: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMeetingSettingsQuery: () => gql.settings(),
  useMeetingSlackChannelsQuery: () => gql.slack(),
}));

// The form has its own tests; here it only shows what the panel handed it.
vi.mock('../../../../src/pages/meetings/forms/meeting-settings', () => ({
  MeetingSettingsForm: ({
    initial,
    channels,
  }: Readonly<{ initial: { bookingSlug: string }; channels: SelectOption[] }>) => (
    <div>
      <p>Settings form for {initial.bookingSlug}</p>
      <ul aria-label="channels">
        {channels.map((channel) => (
          <li key={channel.value}>{channel.label}</li>
        ))}
      </ul>
    </div>
  ),
}));

const channels = [
  { id: 'C1', name: 'sales', isPrivate: false, isMember: false },
  { id: 'C2', name: 'deals', isPrivate: true, isMember: true },
  { id: 'C3', name: 'board', isPrivate: true, isMember: false },
];

function channelLabels() {
  return screen.getAllByRole('listitem').map((item) => item.textContent);
}

describe('MeetingSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.settings.mockReturnValue(answered({ meetingSettings: settingsRow() }));
    gql.slack.mockReturnValue(answered({ meetingSlackChannels: channels }));
  });

  it('hands the form the saved settings and every Slack channel, "Don’t post" first', () => {
    renderWithProviders(<MeetingSettingsPanel />);

    expect(screen.getByText('Settings form for team')).toBeInTheDocument();
    expect(channelLabels()).toEqual([
      "Don't post to Slack",
      '#sales',
      '#deals',
      '#board (needs /invite)',
    ]);
  });

  it('offers only "Don’t post" while Slack is not connected, and says why', () => {
    gql.slack.mockReturnValue({ data: undefined, loading: false, error: new Error('no slack') });
    renderWithProviders(<MeetingSettingsPanel />);

    expect(channelLabels()).toEqual(["Don't post to Slack"]);
    expect(screen.getByText('no slack')).toBeInTheDocument();
  });

  it('explains a Slack failure in words when the error has none', () => {
    gql.slack.mockReturnValue({ data: undefined, loading: false, error: 'offline' });
    renderWithProviders(<MeetingSettingsPanel />);

    expect(
      screen.getByText('Slack is not connected, so bookings cannot be posted there.'),
    ).toBeInTheDocument();
  });

  it('shows a skeleton while the settings load, without the form', () => {
    gql.settings.mockReturnValue(pending());
    renderWithProviders(<MeetingSettingsPanel />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/Settings form/)).not.toBeInTheDocument();
  });

  it('reports settings that failed to load, with no form or skeleton', () => {
    gql.settings.mockReturnValue({ data: undefined, loading: false, error: 'down' });
    renderWithProviders(<MeetingSettingsPanel />);

    expect(screen.getByText('Could not load the meeting settings.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/Settings form/)).not.toBeInTheDocument();
  });
});

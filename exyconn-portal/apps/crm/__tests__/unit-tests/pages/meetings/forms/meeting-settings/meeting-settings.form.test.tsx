import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appBaseUrl } from '@exyconn/shell/config/apps';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { MeetingSettingsForm } from '../../../../../../src/pages/meetings/forms/meeting-settings';
import { renderWithProviders } from '../../../../test-utils';
import { chooseOption, fillField, press } from '../../../../form-helpers';
import { settingsRow } from '../../meetings-fixtures';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveMeetingSettingsMutation: () => [gql.save],
}));

const channels = [
  { value: '', label: "Don't post to Slack" },
  { value: 'C1', label: '#sales' },
];
const base = appBaseUrl('crm');

function renderForm() {
  renderWithProviders(<MeetingSettingsForm initial={settingsRow()} channels={channels} />);
}

function savedWith(input: object) {
  return {
    variables: { input },
    refetchQueries: ['MeetingSettings', 'MeetingTypes', 'MeetingBookingPagePath'],
    awaitRefetchQueries: true,
  };
}

describe('MeetingSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.save.mockResolvedValue({ data: { saveMeetingSettings: settingsRow() } });
  });

  it('previews the booking page address as the slug is typed, warning once it changes', async () => {
    renderForm();
    expect(screen.getByText(`Your booking page: ${base}/book/team`)).toBeInTheDocument();
    expect(screen.queryByText(/stops the old link working/)).not.toBeInTheDocument();

    await fillField('Booking page address', 'sales');

    expect(screen.getByText(`Your booking page: ${base}/book/sales`)).toBeInTheDocument();
    expect(screen.getByText(/stops the old link working/)).toHaveTextContent(
      `anyone with ${base}/book/team will see`,
    );
  });

  it('saves the Slack channel and rooms without asking when the address is unchanged', async () => {
    renderForm();
    await chooseOption('Post new bookings to Slack', '#sales');
    await fillField('Zoom link', 'https://zoom.us/j/42');

    await press('Save settings');

    await waitFor(() =>
      expect(gql.save).toHaveBeenCalledWith(
        savedWith({
          bookingSlug: 'team',
          slackChannel: 'C1',
          googleMeetUrl: '',
          zoomUrl: 'https://zoom.us/j/42',
        }),
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('Meeting settings saved')).toBeInTheDocument();
  });

  it('does not save a room on the wrong host', async () => {
    renderForm();
    await fillField('Google Meet link', 'https://zoom.us/j/1');

    await press('Save settings');

    expect(
      await screen.findByText('Enter the full Google Meet link, e.g. https://meet.google.com/…'),
    ).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('confirms a new address first, naming the link that stops working', async () => {
    renderForm();
    await fillField('Booking page address', 'sales');
    await press('Save settings');

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/stop working straight away/)).toHaveTextContent(
      `(${base}/book/team) stop working`,
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Change address' }));

    await waitFor(() =>
      expect(gql.save).toHaveBeenCalledWith(
        savedWith({ bookingSlug: 'sales', slackChannel: '', googleMeetUrl: '', zoomUrl: '' }),
      ),
    );
  });

  it('keeps the old address when the change is not confirmed', async () => {
    renderForm();
    await fillField('Booking page address', 'sales');
    await press('Save settings');

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('says why the save failed and logs it', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.save.mockRejectedValueOnce(new Error('That address is taken'));
    renderForm();

    await press('Save settings');

    expect(await screen.findByText('That address is taken')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith('crm: saving meeting settings failed', expect.any(Error));
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    gql.save.mockRejectedValueOnce('offline');
    renderForm();

    await press('Save settings');

    expect(await screen.findByText('Could not save the meeting settings')).toBeInTheDocument();
  });

  it('puts the saved settings back on cancel', async () => {
    renderForm();
    await fillField('Booking page address', 'sales');

    await press('Cancel');

    expect(screen.getByLabelText(/^Booking page address\s*\*?$/)).toHaveValue('team');
    expect(screen.queryByText(/stops the old link working/)).not.toBeInTheDocument();
  });
});

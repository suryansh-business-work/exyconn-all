import {
  DEFAULT_BOOKING_SLUG,
  MeetingSettingsModel,
  meetingSettings,
  saveMeetingSettings,
} from '../../../../../src/modules/crm/meetings/meeting.settings';
import { codeOf } from '../../codeOf';

const valid = {
  bookingSlug: 'talk-to-us',
  slackChannel: ' C123 ',
  googleMeetUrl: ' https://meet.google.com/abc-defg-hij ',
  zoomUrl: 'https://acme.zoom.us/j/123',
};

describe('meetingSettings', () => {
  it('creates the defaults the first time anything reads them, once', async () => {
    await expect(meetingSettings()).resolves.toEqual({
      bookingSlug: DEFAULT_BOOKING_SLUG,
      slackChannel: '',
      googleMeetUrl: '',
      zoomUrl: '',
    });
    await meetingSettings();

    await expect(MeetingSettingsModel.countDocuments()).resolves.toBe(1);
  });

  it('reads fields a row saved before they existed as empty', async () => {
    await MeetingSettingsModel.collection.insertOne({ bookingSlug: 'old-page' });

    await expect(meetingSettings()).resolves.toEqual({
      bookingSlug: 'old-page',
      slackChannel: '',
      googleMeetUrl: '',
      zoomUrl: '',
    });
  });
});

describe('saveMeetingSettings', () => {
  it('saves tidied values and reads them back', async () => {
    const saved = await saveMeetingSettings({ ...valid, bookingSlug: ' Talk-To-Us ' });

    expect(saved).toEqual({
      bookingSlug: 'talk-to-us',
      slackChannel: 'C123',
      googleMeetUrl: 'https://meet.google.com/abc-defg-hij',
      zoomUrl: 'https://acme.zoom.us/j/123',
    });
    await expect(meetingSettings()).resolves.toEqual(saved);
  });

  it('clears the Slack channel and video links left out', async () => {
    await saveMeetingSettings(valid);

    const saved = await saveMeetingSettings({
      bookingSlug: 'talk-to-us',
      slackChannel: null,
      googleMeetUrl: null,
      zoomUrl: '   ',
    });

    expect(saved).toEqual({
      bookingSlug: 'talk-to-us',
      slackChannel: '',
      googleMeetUrl: '',
      zoomUrl: '',
    });
    await expect(MeetingSettingsModel.countDocuments()).resolves.toBe(1);
  });

  it('refuses a booking page address that is not a slug', async () => {
    await expect(saveMeetingSettings({ ...valid, bookingSlug: 'no' })).rejects.toThrow(
      'for the booking page address.',
    );
    await expect(MeetingSettingsModel.countDocuments()).resolves.toBe(0);
  });

  it.each([
    ['not a link', 'meet.google.com/abc'],
    ['plain http', 'http://meet.google.com/abc'],
    ['another host', 'https://evil.example.com/meet.google.com'],
    ['a look-alike host', 'https://notmeet.google.com.evil.io/abc'],
  ])('refuses a Google Meet link that is %s', async (_label, googleMeetUrl) => {
    const error = saveMeetingSettings({ ...valid, googleMeetUrl });

    await expect(error).rejects.toThrow(
      'Enter a Google Meet link that starts with https://meet.google.com/.',
    );
  });

  it('accepts the Zoom host itself and refuses another one', async () => {
    await expect(
      saveMeetingSettings({ ...valid, zoomUrl: 'https://zoom.us/j/1' }),
    ).resolves.toEqual(expect.objectContaining({ zoomUrl: 'https://zoom.us/j/1' }));
    await expect(
      codeOf(saveMeetingSettings({ ...valid, zoomUrl: 'https://zoom.example.com/j/1' })),
    ).resolves.toBe('BAD_USER_INPUT');
  });
});

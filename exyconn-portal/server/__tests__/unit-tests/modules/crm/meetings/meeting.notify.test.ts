import {
  announceBooking,
  joinLines,
  type BookingNotice,
} from '../../../../../src/modules/crm/meetings/meeting.notify';
import type { MeetingSettings } from '../../../../../src/modules/crm/meetings/meeting.settings';
import { mailer } from '../../../../../src/utils/mailer';
import { slackNotifier } from '../../../../../src/utils/slack';
import { logger } from '../../../../../src/utils/logger';

jest.mock('../../../../../src/utils/mailer', () => ({
  mailer: { sendCustomEmail: jest.fn() },
}));

const notice: BookingNotice = {
  title: 'Intro call',
  durationMinutes: 30,
  hostName: 'Asha',
  hostEmail: 'asha@acme.test',
  location: '',
  hostZone: 'Asia/Kolkata',
  startAt: new Date('2026-10-20T04:30:00.000Z'),
  name: 'Bo',
  email: 'bo@client.test',
  notes: '',
  timezone: 'UTC',
  guests: [],
};

const bare: MeetingSettings = {
  bookingSlug: 'meeting',
  slackChannel: '',
  googleMeetUrl: '',
  zoomUrl: '',
};

const rooms: MeetingSettings = {
  ...bare,
  googleMeetUrl: 'https://meet.google.com/abc',
  zoomUrl: 'https://zoom.us/j/1',
};

/** Lets the fire-and-forget sends and their failure handlers run. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

const send = jest.mocked(mailer.sendCustomEmail);
let post: jest.SpyInstance;
let warn: jest.SpyInstance;

beforeEach(() => {
  send.mockReset().mockResolvedValue(undefined);
  post = jest.spyOn(slackNotifier, 'post').mockResolvedValue({ channel: 'C1', ts: '1' });
  warn = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const sent = () => send.mock.calls.map(([payload]) => payload);

describe('joinLines', () => {
  it('lists each video room that is set, and nothing when none is', () => {
    expect(joinLines(rooms)).toEqual([
      'Google Meet: https://meet.google.com/abc',
      'Zoom: https://zoom.us/j/1',
    ]);
    expect(joinLines({ googleMeetUrl: '', zoomUrl: 'https://zoom.us/j/1' })).toEqual([
      'Zoom: https://zoom.us/j/1',
    ]);
    expect(joinLines(bare)).toEqual([]);
  });
});

describe('announceBooking', () => {
  it('emails the booker in their zone and the host in theirs, with no extras, and skips Slack', async () => {
    announceBooking(notice, bare);
    await settle();

    expect(sent()).toEqual([
      {
        name: 'Bo',
        email: 'bo@client.test',
        subject: 'Booked: Intro call with Asha',
        message:
          'Your 30-minute Intro call with Asha is booked for Tuesday, October 20, 2026 at 4:30 AM (UTC).',
      },
      {
        name: 'Asha',
        email: 'asha@acme.test',
        subject: 'New booking: Intro call with Bo',
        message:
          'Bo (bo@client.test) booked Intro call for Tuesday, October 20, 2026 at 10:00 AM (Asia/Kolkata).',
      },
    ]);
    expect(post).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('invites each guest and tells everyone where, the notes and the rooms', async () => {
    announceBooking(
      { ...notice, location: 'Office 4', notes: 'About pricing', guests: ['cy@client.test'] },
      rooms,
    );
    await settle();

    const [booker, guest, host] = sent();
    const where =
      '\n\nWhere: Office 4\nGoogle Meet: https://meet.google.com/abc\nZoom: https://zoom.us/j/1';

    expect(booker.message.endsWith(where)).toBe(true);
    expect(guest).toEqual({
      name: 'cy@client.test',
      email: 'cy@client.test',
      subject: 'Invited: Intro call with Asha',
      message: expect.stringMatching(/^Bo invited you\. The 30-minute Intro call/),
    });
    expect(host.message).toContain(
      '\n\nNotes: About pricing\n\nGuests: cy@client.test\n\nWhere: Office 4',
    );
  });

  it('posts to the chosen Slack channel, escaping what the booker typed', async () => {
    announceBooking(
      { ...notice, name: 'Bo <b>', notes: 'R&D > sales', guests: ['cy@client.test'] },
      { ...rooms, slackChannel: 'C42' },
    );
    await settle();

    expect(post).toHaveBeenCalledWith(
      'C42',
      [
        ':calendar: New booking: *Intro call* with Asha',
        'Bo &lt;b&gt; (bo@client.test) · Tuesday, October 20, 2026 at 10:00 AM (Asia/Kolkata)',
        'Guests: cy@client.test',
        'Notes: R&amp;D &gt; sales',
        'Google Meet: https://meet.google.com/abc',
        'Zoom: https://zoom.us/j/1',
      ].join('\n'),
    );
  });

  it('leaves out empty guests and notes on Slack', async () => {
    announceBooking(notice, { ...bare, slackChannel: 'C42' });
    await settle();

    expect(post.mock.calls[0][1]).toBe(
      ':calendar: New booking: *Intro call* with Asha\nBo (bo@client.test) · Tuesday, October 20, 2026 at 10:00 AM (Asia/Kolkata)',
    );
  });

  it('logs a failed email or Slack post without throwing', async () => {
    const down = new Error('SMTP down');
    const slackDown = new Error('Slack down');
    send.mockRejectedValue(down);
    post.mockRejectedValue(slackDown);

    expect(() => announceBooking(notice, { ...bare, slackChannel: 'C42' })).not.toThrow();
    await settle();

    expect(warn).toHaveBeenCalledWith({ err: down }, 'Meeting confirmation email failed');
    expect(warn).toHaveBeenCalledWith({ err: slackDown }, 'Meeting booking Slack post failed');
  });
});

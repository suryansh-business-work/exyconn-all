import { logger } from '../../../utils/logger';
import { mailer } from '../../../utils/mailer';
import { slackNotifier } from '../../../utils/slack';
import type { MeetingSettings } from './meeting.settings';

/** What every message about a new booking needs to say. */
export interface BookingNotice {
  title: string;
  durationMinutes: number;
  hostName: string;
  hostEmail: string;
  /** The meeting type's own location (an address, a phone number, a link). */
  location: string;
  /** The host's zone, for the host's and the Slack message's times. */
  hostZone: string;
  startAt: Date;
  name: string;
  email: string;
  notes: string;
  /** The booker's zone, for their confirmation. */
  timezone: string;
  guests: string[];
}

const when = (at: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'short', timeZone }).format(at);

/** The fixed video rooms from Meeting settings, as "Label: link" lines. */
export function joinLines(settings: Pick<MeetingSettings, 'googleMeetUrl' | 'zoomUrl'>) {
  return [
    settings.googleMeetUrl ? `Google Meet: ${settings.googleMeetUrl}` : '',
    settings.zoomUrl ? `Zoom: ${settings.zoomUrl}` : '',
  ].filter(Boolean);
}

/** Where the meeting happens: its location and the video rooms, one per line. */
function wherePart(notice: BookingNotice, settings: MeetingSettings) {
  const lines = [notice.location ? `Where: ${notice.location}` : '', ...joinLines(settings)];
  const kept = lines.filter(Boolean);
  return kept.length > 0 ? `\n\n${kept.join('\n')}` : '';
}

function emails(notice: BookingNotice, settings: MeetingSettings) {
  const where = wherePart(notice, settings);
  const said = notice.notes ? `\n\nNotes: ${notice.notes}` : '';
  const guestNote = notice.guests.length > 0 ? `\n\nGuests: ${notice.guests.join(', ')}` : '';
  const booked = `${notice.durationMinutes}-minute ${notice.title} with ${notice.hostName} is booked for ${when(notice.startAt, notice.timezone)} (${notice.timezone}).${where}`;
  return [
    mailer.sendCustomEmail({
      name: notice.name,
      email: notice.email,
      subject: `Booked: ${notice.title} with ${notice.hostName}`,
      message: `Your ${booked}`,
    }),
    ...notice.guests.map((guest) =>
      mailer.sendCustomEmail({
        name: guest,
        email: guest,
        subject: `Invited: ${notice.title} with ${notice.hostName}`,
        message: `${notice.name} invited you. The ${booked}`,
      }),
    ),
    mailer.sendCustomEmail({
      name: notice.hostName,
      email: notice.hostEmail,
      subject: `New booking: ${notice.title} with ${notice.name}`,
      message: `${notice.name} (${notice.email}) booked ${notice.title} for ${when(notice.startAt, notice.hostZone)} (${notice.hostZone}).${said}${guestNote}${where}`,
    }),
  ];
}

/** Slack reads &, < and > as markup; a booker's text is shown as typed. */
const escapeSlack = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function slackText(notice: BookingNotice, settings: MeetingSettings) {
  return [
    `:calendar: New booking: *${escapeSlack(notice.title)}* with ${escapeSlack(notice.hostName)}`,
    `${escapeSlack(notice.name)} (${escapeSlack(notice.email)}) · ${when(notice.startAt, notice.hostZone)} (${notice.hostZone})`,
    notice.guests.length > 0 ? `Guests: ${escapeSlack(notice.guests.join(', '))}` : '',
    notice.notes ? `Notes: ${escapeSlack(notice.notes)}` : '',
    ...joinLines(settings),
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Confirms a booking by email to the booker, each guest and the host, and posts it to the
 * Slack channel chosen in Meeting settings. A failure is logged and never undoes the booking.
 */
export function announceBooking(notice: BookingNotice, settings: MeetingSettings) {
  Promise.all(emails(notice, settings)).catch((error: unknown) =>
    logger.warn({ err: error }, 'Meeting confirmation email failed'),
  );
  if (settings.slackChannel) {
    slackNotifier
      .post(settings.slackChannel, slackText(notice, settings))
      .catch((error: unknown) => logger.warn({ err: error }, 'Meeting booking Slack post failed'));
  }
}

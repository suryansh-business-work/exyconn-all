import { stripTags } from '../../utils/textTrim';
import type { CalendarPerson, CalendarTime, GoogleCalendarEvent } from './google-calendar.client';
import { MEET_CODE } from './meeting.lifecycle';

const MEET_ORIGIN = 'https://meet.google.com/';
/** How far an assistant meeting may start outside the event's slot and still be that call. */
const MATCH_WINDOW_MS = 30 * 60_000;
const MAX_DESCRIPTION = 5000;
const MAX_ATTENDEES = 200;

export interface CalendarAttendee {
  email: string | null;
  name: string | null;
  responseStatus: string;
  organizer: boolean;
  self: boolean;
}

/** A Google Calendar event with a Meet link, as the API returns it. */
export interface MeetCalendarEvent {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  meetingCode: string;
  meetUrl: string;
  organizerName: string | null;
  organizerEmail: string | null;
  description: string;
  attendees: CalendarAttendee[];
  /** The assistant meeting that recorded this call, when there is one. */
  meetingId: string | null;
}

/** The fields of an assistant meeting the matching reads. */
export interface MatchableMeeting {
  id: string;
  meetingCode: string;
  startedAt: Date;
}

const ENTITIES: ReadonlyArray<[string, string]> = [
  ['&nbsp;', ' '],
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&quot;', '"'],
  ['&#39;', "'"],
  ['&amp;', '&'],
];

/** Google's HTML description as plain text: line breaks kept, tags dropped, entities decoded. */
export function plainText(html: string): string {
  const lines = html.replaceAll(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n');
  const text = ENTITIES.reduce(
    (out, [entity, char]) => out.replaceAll(entity, char),
    stripTags(lines),
  );
  return text.trim().slice(0, MAX_DESCRIPTION);
}

/** The Meet code of a Meet address (`https://meet.google.com/abc-defg-hij`), or null. */
function codeOfUrl(url: string | undefined): string | null {
  if (!url?.startsWith(MEET_ORIGIN)) {
    return null;
  }
  const code = new URL(url).pathname.slice(1).split('/')[0].toLowerCase();
  return MEET_CODE.test(code) ? code : null;
}

/** The Meet code of an event: its Meet conference id, else the code in its Meet link. */
export function meetCodeOf(event: GoogleCalendarEvent): string | null {
  const conference = event.conferenceData;
  const id = conference?.conferenceId?.toLowerCase() ?? '';
  if (conference?.conferenceSolution?.key?.type === 'hangoutsMeet' && MEET_CODE.test(id)) {
    return id;
  }
  const video = conference?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri;
  return codeOfUrl(event.hangoutLink) ?? codeOfUrl(video);
}

/** An all-day `date` is a calendar day; it is read as that day starting at UTC midnight. */
function instantOf(time: CalendarTime | undefined): Date | null {
  const value = time?.dateTime ?? (time?.date ? `${time.date}T00:00:00Z` : '');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function attendeeOf(person: CalendarPerson): CalendarAttendee {
  return {
    email: person.email ?? null,
    name: person.displayName ?? null,
    responseStatus: person.responseStatus ?? 'needsAction',
    organizer: person.organizer ?? false,
    self: person.self ?? false,
  };
}

/** An event the calendar shows, or null when it is cancelled, undated or not a Meet call. */
export function toMeetEvent(event: GoogleCalendarEvent): MeetCalendarEvent | null {
  const meetingCode = meetCodeOf(event);
  const startsAt = instantOf(event.start);
  if (event.status === 'cancelled' || !meetingCode || !startsAt) {
    return null;
  }
  return {
    id: event.id,
    title: event.summary?.trim() ?? '',
    startsAt,
    endsAt: instantOf(event.end) ?? startsAt,
    allDay: !event.start?.dateTime,
    meetingCode,
    meetUrl: `${MEET_ORIGIN}${meetingCode}`,
    organizerName: event.organizer?.displayName ?? null,
    organizerEmail: event.organizer?.email ?? null,
    description: plainText(event.description ?? ''),
    attendees: (event.attendees ?? [])
      .filter((person) => !person.resource)
      .slice(0, MAX_ATTENDEES)
      .map(attendeeOf),
    meetingId: null,
  };
}

/** The meeting of the same call: same Meet code, starting nearest the event, inside its slot. */
function matchOf(
  event: MeetCalendarEvent,
  meetings: readonly MatchableMeeting[],
): MatchableMeeting | null {
  const earliest = event.startsAt.getTime() - MATCH_WINDOW_MS;
  const latest = event.endsAt.getTime() + MATCH_WINDOW_MS;
  const distance = (meeting: MatchableMeeting) =>
    Math.abs(meeting.startedAt.getTime() - event.startsAt.getTime());
  return meetings
    .filter((meeting) => meeting.meetingCode === event.meetingCode)
    .filter((meeting) => {
      const at = meeting.startedAt.getTime();
      return at >= earliest && at <= latest;
    })
    .reduce<MatchableMeeting | null>(
      (best, meeting) => (best && distance(best) <= distance(meeting) ? best : meeting),
      null,
    );
}

/** Each event with the assistant meeting that recorded it, so one call shows once. */
export function matchEvents(
  events: readonly MeetCalendarEvent[],
  meetings: readonly MatchableMeeting[],
): MeetCalendarEvent[] {
  return events.map((event) => ({ ...event, meetingId: matchOf(event, meetings)?.id ?? null }));
}

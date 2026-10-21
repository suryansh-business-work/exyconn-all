import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { CalendarAccessError, calendarEvents } from './google-calendar.client';
import { accessTokenFor } from './google-meet.client';
import { GOOGLE_CALENDAR_SCOPE, googleMeetConfigured } from './google-meet.connect';
import { matchEvents, toMeetEvent, type MeetCalendarEvent } from './calendar.events';
import { presentMeetings } from './meeting.queries';
import { MaGoogleConnectionModel, MaMeetingModel, type MaMeetingDocument } from './models';
import type { MaActor, MaScopeFilter } from './ma.access';

/** The longest range one request may cover: six weeks, a whole month grid. */
export const MAX_CALENDAR_DAYS = 42;
const DAY_MS = 86_400_000;
/** How long one person's events for one range are reused before Google is asked again. */
export const CALENDAR_CACHE_MS = 60_000;
const MAX_CACHED = 500;
/** The most assistant meetings one range returns. */
const MAX_MEETINGS = 500;

export type GoogleCalendarState =
  'NOT_CONFIGURED' | 'NOT_CONNECTED' | 'RECONNECT_REQUIRED' | 'CONNECTED' | 'UNAVAILABLE';

interface GoogleSide {
  google: GoogleCalendarState;
  googleError: string;
  events: MeetCalendarEvent[];
}

type LeanMeeting = MaMeetingDocument & { _id: unknown };

const cache = new Map<string, { expires: number; events: MeetCalendarEvent[] }>();

/** Forgets every cached calendar (tests, and nothing else, need a clean slate). */
export function clearCalendarCache(): void {
  cache.clear();
}

function remember(key: string, events: MeetCalendarEvent[]): void {
  if (cache.size >= MAX_CACHED) {
    cache.delete(cache.keys().next().value ?? '');
  }
  cache.set(key, { expires: Date.now() + CALENDAR_CACHE_MS, events });
}

/** The range checked: a real span, start before end, at most MAX_CALENDAR_DAYS long. */
export function checkedRange(from: Date, to: Date): { from: Date; to: Date } {
  const span = to.getTime() - from.getTime();
  if (Number.isNaN(span) || span <= 0) {
    badRequest('The calendar range must start before it ends.');
  }
  if (span > MAX_CALENDAR_DAYS * DAY_MS) {
    badRequest(`The calendar shows at most ${MAX_CALENDAR_DAYS} days at a time.`);
  }
  return { from, to };
}

const unavailable = (googleError: string): GoogleSide => ({
  google: 'UNAVAILABLE',
  googleError,
  events: [],
});
const reconnect: GoogleSide = { google: 'RECONNECT_REQUIRED', googleError: '', events: [] };

/** A failed read as what the viewer can do about it. Logged without tokens or event contents. */
function failed(error: unknown): GoogleSide {
  if (error instanceof CalendarAccessError) {
    logger.warn({ status: error.status, reason: error.reason }, 'Google Calendar read failed');
    if (error.reason === 'SCOPE') {
      return reconnect;
    }
    return unavailable(
      error.reason === 'API_DISABLED'
        ? 'The Google Calendar API is not enabled for this company. Ask an administrator to enable it.'
        : 'Google Calendar could not be read just now. Try again in a minute.',
    );
  }
  logger.warn({ reason: 'TOKEN' }, 'Google Calendar token refresh failed');
  return reconnect;
}

/** The viewer's OWN Meet events in the range: never anybody else's calendar. */
async function googleSide(actor: MaActor, organizationId: string, from: Date, to: Date) {
  if (!(await googleMeetConfigured())) {
    return { google: 'NOT_CONFIGURED', googleError: '', events: [] } satisfies GoogleSide;
  }
  const connection = await MaGoogleConnectionModel.findOne({ userId: actor.id }).lean();
  if (!connection) {
    return { google: 'NOT_CONNECTED', googleError: '', events: [] } satisfies GoogleSide;
  }
  // Rows connected before the calendar scope existed carry no scopes at all (lean skips defaults).
  if (!(connection.scopes ?? []).includes(GOOGLE_CALENDAR_SCOPE)) {
    return reconnect;
  }
  const key = `${organizationId}:${actor.id}:${from.toISOString()}:${to.toISOString()}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return { google: 'CONNECTED', googleError: '', events: hit.events } satisfies GoogleSide;
  }
  try {
    const token = await accessTokenFor(connection.refreshToken);
    const events = (await calendarEvents(token, from, to)).flatMap((event) => {
      const shown = toMeetEvent(event);
      return shown ? [shown] : [];
    });
    remember(key, events);
    return { google: 'CONNECTED', googleError: '', events } satisfies GoogleSide;
  } catch (error) {
    return failed(error);
  }
}

/**
 * The calendar for [from, to): the assistant meetings the scope lets the viewer read, and the
 * viewer's own Google Meet events, each matched to the meeting that recorded it.
 */
export async function meetingCalendar(
  actor: MaActor,
  organizationId: string,
  scope: MaScopeFilter,
  range: { from: Date; to: Date },
) {
  const { from, to } = checkedRange(range.from, range.to);
  const rows = await MaMeetingModel.find({ ...scope, startedAt: { $gte: from, $lt: to } })
    .sort({ startedAt: 1 })
    .limit(MAX_MEETINGS)
    .lean<LeanMeeting[]>();
  const [meetings, side] = await Promise.all([
    presentMeetings(rows),
    googleSide(actor, organizationId, from, to),
  ]);
  const matchable = meetings.map((meeting) => ({
    id: meeting.id,
    meetingCode: meeting.meetingCode,
    startedAt: new Date(meeting.startedAt),
  }));
  return { ...side, meetings, events: matchEvents(side.events, matchable) };
}

const EVENTS_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const REQUEST_TIMEOUT_MS = 30_000;
/** Pages read for one range before stopping: a bound, not an expected size. */
const MAX_PAGES = 5;

/** Google Calendar event shapes (only the fields read). */
export interface CalendarTime {
  dateTime?: string;
  date?: string;
}

export interface CalendarPerson {
  email?: string;
  displayName?: string;
  responseStatus?: string;
  organizer?: boolean;
  self?: boolean;
  resource?: boolean;
}

export interface GoogleCalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: CalendarTime;
  end?: CalendarTime;
  hangoutLink?: string;
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: { key?: { type?: string } };
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
  organizer?: CalendarPerson;
  attendees?: CalendarPerson[];
}

/** Why Google would not hand over the calendar. */
export type CalendarFailure = 'SCOPE' | 'API_DISABLED' | 'FAILED';

/** A refused calendar read, with the reason and Google's status code (never the body). */
export class CalendarAccessError extends Error {
  constructor(
    readonly reason: CalendarFailure,
    readonly status: number,
  ) {
    super(`Google Calendar API ${status} (${reason})`);
    this.name = 'CalendarAccessError';
  }
}

/** The reason behind a failed read: a missing scope, a disabled API, or anything else. */
export function failureOf(status: number, detail: string): CalendarFailure {
  if (status === 403 && /insufficient/i.test(detail)) {
    return 'SCOPE';
  }
  if (status === 403 && /accessNotConfigured|SERVICE_DISABLED/.test(detail)) {
    return 'API_DISABLED';
  }
  return 'FAILED';
}

interface PageBody {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
}

async function page(token: string, query: Record<string, string>): Promise<PageBody> {
  const response = await fetch(`${EVENTS_API}?${new URLSearchParams(query).toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = `${response.headers.get('www-authenticate') ?? ''} ${await response.text()}`;
    throw new CalendarAccessError(failureOf(response.status, detail), response.status);
  }
  return (await response.json()) as PageBody;
}

/** Pages are read one after another because each names the next; at most `pagesLeft` more. */
async function pagesFrom(
  token: string,
  query: Record<string, string>,
  pageToken: string,
  pagesLeft: number,
): Promise<GoogleCalendarEvent[]> {
  const body = await page(token, { ...query, ...(pageToken ? { pageToken } : {}) });
  const items = body.items ?? [];
  if (!body.nextPageToken || pagesLeft <= 1) {
    return items;
  }
  return [...items, ...(await pagesFrom(token, query, body.nextPageToken, pagesLeft - 1))];
}

/** The person's primary-calendar events overlapping [from, to), recurring ones expanded. */
export function calendarEvents(
  token: string,
  from: Date,
  to: Date,
): Promise<GoogleCalendarEvent[]> {
  const query = {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  };
  return pagesFrom(token, query, '', MAX_PAGES);
}

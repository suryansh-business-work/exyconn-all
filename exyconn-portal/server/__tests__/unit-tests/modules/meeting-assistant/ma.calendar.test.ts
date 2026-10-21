import { Types } from 'mongoose';
import { maCalendarQueries } from '../../../../src/modules/meeting-assistant/ma.calendar.resolvers';
import {
  CALENDAR_CACHE_MS,
  clearCalendarCache,
} from '../../../../src/modules/meeting-assistant/calendar.service';
import {
  matchEvents,
  meetCodeOf,
  plainText,
  toMeetEvent,
  type MeetCalendarEvent,
} from '../../../../src/modules/meeting-assistant/calendar.events';
import { failureOf } from '../../../../src/modules/meeting-assistant/google-calendar.client';
import { GOOGLE_CALENDAR_SCOPE } from '../../../../src/modules/meeting-assistant/google-meet.connect';
import { MaGoogleConnectionModel } from '../../../../src/modules/meeting-assistant/models';
import { readGoogleConfig } from '../../../../src/modules/auth/google/google-sign-in.config';
import { seal } from '../../../../src/utils/secretBox';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxOf, seedAccount, seedMeeting } from './ma.fixtures';

jest.mock('../../../../src/modules/auth/google/google-sign-in.config', () => ({
  readGoogleConfig: jest.fn(),
}));

const organizationId = useTestOrganization();
const googleConfig = readGoogleConfig as jest.Mock;

const FROM = new Date('2026-09-30T00:00:00Z');
const TO = new Date('2026-11-02T00:00:00Z');
const STARTS = '2026-10-14T10:00:00Z';
const ENDS = '2026-10-14T10:30:00Z';

let viewer: MaActor;
let asViewer: GraphQLContext;

const calendar = (ctx: GraphQLContext, from: Date = FROM, to: Date = TO, scope?: 'MINE' | 'ALL') =>
  maCalendarQueries.maCalendar(null, { from, to, scope }, { ...ctx, organizationId });

const googleEvent = (overrides: Record<string, unknown> = {}) => ({
  id: 'evt-1',
  summary: ' Design review ',
  description: 'Agenda<br>1. Mocks &amp; <b>copy</b>',
  start: { dateTime: STARTS },
  end: { dateTime: ENDS },
  hangoutLink: 'https://meet.google.com/abc-defg-hij',
  organizer: { email: 'lead@exyconn.com', displayName: 'Lead' },
  attendees: [
    { email: 'asha@exyconn.com', displayName: 'Asha', responseStatus: 'accepted', self: true },
    { email: 'room@resource.calendar.google.com', resource: true },
    { email: 'guest@example.com' },
  ],
  ...overrides,
});

/** The viewer's Google connection; `null` scopes is a row from before scopes were stored. */
async function connect(scopes: string[] | null = [GOOGLE_CALENDAR_SCOPE]) {
  await MaGoogleConnectionModel.create({
    userId: viewer.id,
    email: 'asha@gmail.com',
    refreshToken: seal('refresh'),
    scopes: scopes ?? [],
  });
  if (scopes === null) {
    await MaGoogleConnectionModel.collection.updateOne(
      { userId: viewer.id },
      { $unset: { scopes: '' } },
    );
  }
}

/** Answers the token refresh and each Calendar page from `pages`, in order. */
function fakeGoogle(pages: Array<{ status?: number; body: unknown; header?: string }>) {
  const queue = [...pages];
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    if (String(input).startsWith('https://oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'access' }));
    }
    const next = queue.shift() ?? { body: {} };
    const headers = next.header ? { 'www-authenticate': next.header } : undefined;
    const body = typeof next.body === 'string' ? next.body : JSON.stringify(next.body);
    return new Response(body, { status: next.status ?? 200, headers });
  });
}

beforeEach(async () => {
  clearCalendarCache();
  googleConfig.mockResolvedValue({ clientId: 'id', clientSecret: 'secret' });
  viewer = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  asViewer = ctxOf(viewer, [ROLES.EMPLOYEE]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('calendar events', () => {
  it('reads Google HTML descriptions as plain text', () => {
    expect(plainText('<p>Hi&nbsp;team</p><ul><li>a &lt;b&gt;</li></ul>&quot;x&#39;')).toBe(
      'Hi team\na <b>\n"x\'',
    );
    expect(plainText('x'.repeat(6000))).toHaveLength(5000);
  });

  it('finds the Meet code in the conference, the Meet link or the video entry point', () => {
    const meet = { key: { type: 'hangoutsMeet' } };
    expect(
      meetCodeOf({
        id: '1',
        conferenceData: { conferenceId: 'ABC-DEFG-HIJ', conferenceSolution: meet },
      }),
    ).toBe('abc-defg-hij');
    expect(meetCodeOf({ id: '1', hangoutLink: 'https://meet.google.com/xyz-abcd-efg?pli=1' })).toBe(
      'xyz-abcd-efg',
    );
    const video = { entryPointType: 'video', uri: 'https://meet.google.com/qrs-tuvw-xyz' };
    expect(
      meetCodeOf({ id: '1', conferenceData: { conferenceId: 'zoom-1', entryPoints: [video] } }),
    ).toBe('qrs-tuvw-xyz');
    expect(meetCodeOf({ id: '1', hangoutLink: 'https://zoom.us/j/1' })).toBeNull();
    expect(meetCodeOf({ id: '1', hangoutLink: 'https://meet.google.com/landing' })).toBeNull();
  });

  it('keeps only dated, live Meet events, without meeting rooms', () => {
    const shown = toMeetEvent(googleEvent());
    expect(shown).toMatchObject({
      title: 'Design review',
      allDay: false,
      meetingCode: 'abc-defg-hij',
      meetUrl: 'https://meet.google.com/abc-defg-hij',
      organizerName: 'Lead',
      description: 'Agenda\n1. Mocks & copy',
      meetingId: null,
    });
    expect(shown?.attendees).toEqual([
      {
        email: 'asha@exyconn.com',
        name: 'Asha',
        responseStatus: 'accepted',
        organizer: false,
        self: true,
      },
      {
        email: 'guest@example.com',
        name: null,
        responseStatus: 'needsAction',
        organizer: false,
        self: false,
      },
    ]);
    expect(toMeetEvent(googleEvent({ status: 'cancelled' }))).toBeNull();
    expect(toMeetEvent(googleEvent({ hangoutLink: undefined }))).toBeNull();
    expect(toMeetEvent(googleEvent({ start: { dateTime: 'nope' } }))).toBeNull();
  });

  it('reads an all-day event as its day and an event with no end as instant', () => {
    const allDay = toMeetEvent(
      googleEvent({ start: { date: '2026-10-14' }, end: undefined, summary: undefined }),
    );
    expect(allDay).toMatchObject({
      allDay: true,
      title: '',
      description: 'Agenda\n1. Mocks & copy',
    });
    expect(allDay?.startsAt.toISOString()).toBe('2026-10-14T00:00:00.000Z');
    expect(allDay?.endsAt).toEqual(allDay?.startsAt);
    const bare = toMeetEvent({
      id: 'e',
      hangoutLink: 'https://meet.google.com/abc-defg-hij',
      start: { dateTime: STARTS },
    });
    expect(bare).toMatchObject({ description: '', attendees: [], organizerEmail: null });
  });

  it('matches an event to the meeting of the same call that started nearest it', () => {
    const event = toMeetEvent(googleEvent()) as MeetCalendarEvent;
    const at = (iso: string) => new Date(iso);
    const meetings = [
      { id: 'far', meetingCode: 'abc-defg-hij', startedAt: at('2026-10-14T12:00:00Z') },
      { id: 'late', meetingCode: 'abc-defg-hij', startedAt: at('2026-10-14T10:20:00Z') },
      { id: 'near', meetingCode: 'abc-defg-hij', startedAt: at('2026-10-14T10:02:00Z') },
      { id: 'other', meetingCode: 'xyz-abcd-efg', startedAt: at(STARTS) },
      { id: 'later', meetingCode: 'abc-defg-hij', startedAt: at('2026-10-14T10:25:00Z') },
    ];
    expect(matchEvents([event], meetings)[0].meetingId).toBe('near');
    expect(matchEvents([event], meetings.slice(0, 1))[0].meetingId).toBeNull();
  });

  it('tells a missing scope and a disabled API apart from other failures', () => {
    expect(failureOf(403, 'Bearer error="insufficient_scope"')).toBe('SCOPE');
    expect(failureOf(403, '{"reason":"accessNotConfigured"}')).toBe('API_DISABLED');
    expect(failureOf(403, 'forbidden')).toBe('FAILED');
    expect(failureOf(500, 'insufficient')).toBe('FAILED');
  });
});

describe('maCalendar', () => {
  it('refuses a backwards, empty or longer-than-42-day range', async () => {
    expect(await codeOf(calendar(asViewer, TO, FROM))).toBe('BAD_USER_INPUT');
    expect(await codeOf(calendar(asViewer, new Date('nope'), TO))).toBe('BAD_USER_INPUT');
    const long = new Date(FROM.getTime() + 43 * 86_400_000);
    expect(await codeOf(calendar(asViewer, FROM, long))).toBe('BAD_USER_INPUT');
  });

  it("lists only the viewer's own meetings in the range, and the company's for the AI role", async () => {
    const other = await seedAccount('Ravi', [ROLES.EMPLOYEE]);
    await seedMeeting(viewer, { startedAt: new Date(STARTS), title: 'Mine' });
    // Its own Meet code: one person can have only one live meeting per code.
    await seedMeeting(viewer, {
      startedAt: new Date('2026-12-01T10:00:00Z'),
      title: 'Later',
      meetingCode: 'lat-erxx-mtg',
    });
    await seedMeeting(other, { startedAt: new Date(STARTS), title: 'Theirs' });

    const mine = await calendar(asViewer);
    const all = await calendar(ctxOf(viewer, [ROLES.AI]), FROM, TO, 'ALL');

    expect(mine.meetings.map((meeting) => meeting.title)).toEqual(['Mine']);
    expect(all.meetings.map((meeting) => meeting.title).sort((a, b) => a.localeCompare(b))).toEqual(
      ['Mine', 'Theirs'],
    );
    expect(await codeOf(calendar(asViewer, FROM, TO, 'ALL'))).toBe('FORBIDDEN');
  });

  it('says when Google is not configured, not connected or connected without the calendar scope', async () => {
    googleConfig.mockResolvedValue({ clientId: '', clientSecret: '' });
    expect(await calendar(asViewer)).toMatchObject({ google: 'NOT_CONFIGURED', events: [] });

    googleConfig.mockResolvedValue({ clientId: 'id', clientSecret: 'secret' });
    expect(await calendar(asViewer)).toMatchObject({ google: 'NOT_CONNECTED', events: [] });

    await connect(null);
    expect(await calendar(asViewer)).toMatchObject({ google: 'RECONNECT_REQUIRED', events: [] });
  });

  it("shows the viewer's Meet events, matched to recorded meetings, and reuses them briefly", async () => {
    await connect();
    const meeting = await seedMeeting(viewer, { startedAt: new Date('2026-10-14T10:03:00Z') });
    const fetchSpy = fakeGoogle([
      { body: { items: [googleEvent()], nextPageToken: 'p2' } },
      {
        body: {
          items: [
            googleEvent({ id: 'evt-2', hangoutLink: 'https://meet.google.com/xyz-abcd-efg' }),
            googleEvent({ id: 'evt-3', hangoutLink: undefined }),
          ],
        },
      },
    ]);

    const first = await calendar(asViewer);
    const second = await calendar(asViewer);

    expect(first.google).toBe('CONNECTED');
    expect(first.events.map((event) => [event.id, event.meetingId])).toEqual([
      ['evt-1', (meeting._id as Types.ObjectId).toHexString()],
      ['evt-2', null],
    ]);
    expect(second.events).toEqual(first.events);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    const pageUrl = new URL(String(fetchSpy.mock.calls[1][0]));
    expect(pageUrl.pathname).toBe('/calendar/v3/calendars/primary/events');
    expect(pageUrl.searchParams.get('timeMin')).toBe(FROM.toISOString());
    expect(pageUrl.searchParams.get('singleEvents')).toBe('true');
    expect(new URL(String(fetchSpy.mock.calls[2][0])).searchParams.get('pageToken')).toBe('p2');
  });

  it('asks Google again once the cache has expired', async () => {
    await connect();
    const fetchSpy = fakeGoogle([{ body: { items: [] } }, { body: {} }]);
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    await calendar(asViewer);
    jest.spyOn(Date, 'now').mockReturnValue(now + CALENDAR_CACHE_MS + 1);

    expect((await calendar(asViewer)).events).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it('asks to reconnect when Google refuses the scope or the refresh token', async () => {
    await connect();
    fakeGoogle([{ status: 403, header: 'Bearer error="insufficient_scope"', body: 'denied' }]);
    expect(await calendar(asViewer)).toMatchObject({ google: 'RECONNECT_REQUIRED' });

    jest.restoreAllMocks();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 }));
    expect(await calendar(asViewer)).toMatchObject({ google: 'RECONNECT_REQUIRED', events: [] });
  });

  it('explains a disabled Calendar API and any other failure without failing the page', async () => {
    await connect();
    await seedMeeting(viewer, { startedAt: new Date(STARTS) });
    fakeGoogle([{ status: 403, body: { error: { errors: [{ reason: 'accessNotConfigured' }] } } }]);
    const disabled = await calendar(asViewer);
    fakeGoogle([{ status: 500, body: 'boom' }]);
    const failed = await calendar(asViewer);

    expect(disabled).toMatchObject({ google: 'UNAVAILABLE' });
    expect(disabled.googleError).toContain('Google Calendar API is not enabled');
    expect(disabled.meetings).toHaveLength(1);
    expect(failed.googleError).toBe(
      'Google Calendar could not be read just now. Try again in a minute.',
    );
  });
});

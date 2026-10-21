import {
  MaCalendarGoogleState,
  MaMeetingStatus,
  type MaCalendarQuery,
} from '@exyconn/shell/graphql/generated';

type Calendar = MaCalendarQuery['maCalendar'];
export type CalendarMeetingRow = Calendar['meetings'][number];
export type CalendarEventRow = Calendar['events'][number];

export function calendarMeeting(patch: Partial<CalendarMeetingRow> = {}): CalendarMeetingRow {
  return {
    id: 'm1',
    meetingCode: 'abc-defg-hij',
    title: 'Weekly sync',
    ownerName: 'Asha',
    startedAt: '2026-10-14T10:00:00.000Z',
    endedAt: '2026-10-14T10:30:00.000Z',
    status: MaMeetingStatus.Ended,
    ...patch,
  };
}

export function calendarEvent(patch: Partial<CalendarEventRow> = {}): CalendarEventRow {
  return {
    id: 'e1',
    title: 'Design review',
    startsAt: '2026-10-15T09:00:00.000Z',
    endsAt: '2026-10-15T09:45:00.000Z',
    allDay: false,
    meetingCode: 'xyz-abcd-efg',
    meetUrl: 'https://meet.google.com/xyz-abcd-efg',
    organizerName: 'Lead',
    organizerEmail: 'lead@exyconn.com',
    description: 'Agenda\n<b>not bold</b>',
    meetingId: null,
    attendees: [
      {
        email: 'lead@exyconn.com',
        name: 'Lead',
        responseStatus: 'accepted',
        organizer: true,
        self: false,
      },
      {
        email: 'guest@example.com',
        name: null,
        responseStatus: 'declined',
        organizer: false,
        self: false,
      },
      {
        email: null,
        name: 'Phone guest',
        responseStatus: 'tentative',
        organizer: false,
        self: false,
      },
      { email: null, name: null, responseStatus: 'needsAction', organizer: false, self: true },
    ],
    ...patch,
  };
}

export function calendarData(patch: Partial<Calendar> = {}): { maCalendar: Calendar } {
  return {
    maCalendar: {
      google: MaCalendarGoogleState.Connected,
      googleError: '',
      meetings: [calendarMeeting()],
      events: [calendarEvent()],
      ...patch,
    },
  };
}

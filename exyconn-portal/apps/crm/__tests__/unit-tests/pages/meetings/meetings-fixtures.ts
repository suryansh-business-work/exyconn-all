import {
  MeetingBookingStatus,
  MeetingVisitKind,
  type MeetingBookingFieldsFragment,
  type MeetingSettingsFieldsFragment,
  type MeetingTrackingQuery,
  type MeetingTypeFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export type Tracking = MeetingTrackingQuery['meetingTracking'];

/** A saved meeting type: weekdays 10:00–16:00, open, with a 15-minute buffer. */
export function meetingTypeRow(
  overrides: Partial<MeetingTypeFieldsFragment> = {},
): MeetingTypeFieldsFragment {
  return {
    id: 'type-1',
    title: 'Intro call',
    slug: 'intro-call',
    bookingPath: '/book/team/intro-call',
    description: 'A first chat',
    durationMinutes: 30,
    location: 'https://meet.google.com/abc',
    hostName: 'Priya',
    hostEmail: 'priya@acme.io',
    timezone: 'Asia/Kolkata',
    bufferMinutes: 15,
    minNoticeHours: 2,
    maxDaysAhead: 60,
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    weeklyHours: [1, 2, 3, 4, 5].map((day) => ({
      day,
      enabled: true,
      start: '10:00',
      end: '16:00',
    })),
    ...overrides,
  };
}

export function bookingRow(
  overrides: Partial<MeetingBookingFieldsFragment> = {},
): MeetingBookingFieldsFragment {
  return {
    id: 'booking-1',
    meetingTypeId: 'type-1',
    meetingTitle: 'Intro call',
    hostName: 'Priya',
    startAt: '2026-10-20T09:30:00.000Z',
    endAt: '2026-10-20T10:00:00.000Z',
    name: 'Sam Lee',
    email: 'sam@globex.com',
    notes: '',
    guests: [],
    timezone: 'UTC',
    country: 'GB',
    status: MeetingBookingStatus.Confirmed,
    contactId: '',
    createdAt: '2026-10-18T09:30:00.000Z',
    ...overrides,
  };
}

export function settingsRow(
  overrides: Partial<MeetingSettingsFieldsFragment> = {},
): MeetingSettingsFieldsFragment {
  return {
    bookingSlug: 'team',
    slackChannel: '',
    googleMeetUrl: '',
    zoomUrl: '',
    ...overrides,
  };
}

/** A month of tracking: one known country, one with no name, the page and one meeting. */
export function trackingData(overrides: Partial<Tracking> = {}): Tracking {
  return {
    days: 30,
    views: 8,
    bookings: 2,
    byCountry: [
      { country: 'GB', countryName: 'United Kingdom', views: 6, bookings: 2 },
      { country: '', countryName: '', views: 2, bookings: 0 },
    ],
    byMeeting: [
      { meetingSlug: '', views: 3, bookings: 0 },
      { meetingSlug: 'intro-call', views: 4, bookings: 2 },
      { meetingSlug: 'retired', views: 1, bookings: 0 },
    ],
    byDay: [
      { day: '2026-10-17', views: 5, bookings: 1 },
      { day: '2026-10-18', views: 3, bookings: 1 },
    ],
    recent: [
      {
        id: 'visit-1',
        kind: MeetingVisitKind.View,
        meetingSlug: 'intro-call',
        country: 'GB',
        countryName: 'United Kingdom',
        at: '2026-10-18T09:30:00.000Z',
      },
      {
        id: 'visit-2',
        kind: MeetingVisitKind.View,
        meetingSlug: '',
        country: '',
        countryName: '',
        at: '2026-10-18T08:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

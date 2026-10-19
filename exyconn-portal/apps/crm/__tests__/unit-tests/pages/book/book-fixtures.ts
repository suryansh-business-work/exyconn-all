import type {
  BookMeetingMutation,
  PublicBookingPageQuery,
  PublicMeetingFieldsFragment,
} from '@exyconn/shell/graphql/generated';

export function publicMeeting(
  overrides: Partial<PublicMeetingFieldsFragment> = {},
): PublicMeetingFieldsFragment {
  return {
    slug: 'intro-call',
    title: 'Intro call',
    description: 'A first chat about your team.',
    durationMinutes: 30,
    hostName: 'Priya',
    timezone: 'Asia/Kolkata',
    organizationName: 'Acme',
    organizationSlug: 'acme',
    logoUrl: 'https://cdn.acme.io/logo.svg',
    logoDarkUrl: 'https://cdn.acme.io/logo-dark.svg',
    hasLocation: true,
    ...overrides,
  };
}

export function bookingPage(
  overrides: Partial<PublicBookingPageQuery['publicBookingPage']> = {},
): PublicBookingPageQuery['publicBookingPage'] {
  return {
    organizationName: 'Acme',
    organizationSlug: 'acme',
    logoUrl: 'https://cdn.acme.io/logo.svg',
    logoDarkUrl: '',
    meetings: [
      publicMeeting(),
      publicMeeting({ slug: 'demo', title: 'Demo', durationMinutes: 45, description: '' }),
    ],
    ...overrides,
  };
}

export function bookedMeeting(
  overrides: Partial<BookMeetingMutation['bookMeeting']> = {},
): BookMeetingMutation['bookMeeting'] {
  return {
    title: 'Intro call',
    hostName: 'Priya',
    startAt: '2026-10-21T09:00:00.000Z',
    endAt: '2026-10-21T09:30:00.000Z',
    location: 'Room 4',
    joinLinks: ['Zoom: https://zoom.us/j/42'],
    ...overrides,
  };
}

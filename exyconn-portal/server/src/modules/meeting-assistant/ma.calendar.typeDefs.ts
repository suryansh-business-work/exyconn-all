import gql from 'graphql-tag';

/** The Meeting Assistant calendar: recorded meetings and the viewer's own Google Meet events. */
export const maCalendarTypeDefs = gql`
  "Whether the viewer's Google Meet events can be shown on the calendar."
  enum MaCalendarGoogleState {
    "The company has no Google sign-in client in Tech."
    NOT_CONFIGURED
    "The viewer has not connected Google Meet."
    NOT_CONNECTED
    "The connection predates the calendar scope, or Google no longer accepts it."
    RECONNECT_REQUIRED
    CONNECTED
    "Google could not be read just now; googleError says why."
    UNAVAILABLE
  }

  "Somebody invited to a Google Calendar event. responseStatus is Google's own value, e.g. accepted."
  type MaCalendarAttendee {
    email: String
    name: String
    responseStatus: String!
    organizer: Boolean!
    self: Boolean!
  }

  "A Google Calendar event of the viewer's that has a Google Meet link. description is plain text."
  type MaCalendarEvent {
    id: ID!
    title: String!
    startsAt: DateTime!
    endsAt: DateTime!
    allDay: Boolean!
    meetingCode: String!
    meetUrl: String!
    organizerName: String
    organizerEmail: String
    description: String!
    attendees: [MaCalendarAttendee!]!
    "The assistant meeting that recorded this call, when there is one."
    meetingId: ID
  }

  type MaCalendar {
    meetings: [MaMeeting!]!
    events: [MaCalendarEvent!]!
    google: MaCalendarGoogleState!
    googleError: String!
  }

  extend type Query {
    "Meetings started in [from, to) that the scope covers, with the viewer's Meet events. At most 42 days."
    maCalendar(from: DateTime!, to: DateTime!, scope: MaScope): MaCalendar!
  }
`;

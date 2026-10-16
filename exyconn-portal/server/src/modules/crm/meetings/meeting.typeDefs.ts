import gql from 'graphql-tag';

/** CRM > Meetings: Calendly-style meeting types, their public booking page, and bookings. */
export const meetingTypeDefs = gql`
  type MeetingWeeklyHours {
    "0 = Sunday."
    day: Int!
    enabled: Boolean!
    "HH:mm, 24-hour, in the meeting type's time zone."
    start: String!
    end: String!
  }

  input MeetingWeeklyHoursInput {
    day: Int!
    enabled: Boolean!
    start: String!
    end: String!
  }

  type MeetingType {
    id: ID!
    title: String!
    slug: String!
    "The public link's path on the CRM site: /book/<company>/<slug>."
    bookingPath: String!
    description: String!
    durationMinutes: Int!
    location: String!
    hostName: String!
    hostEmail: String!
    timezone: String!
    weeklyHours: [MeetingWeeklyHours!]!
    bufferMinutes: Int!
    minNoticeHours: Int!
    maxDaysAhead: Int!
    active: Boolean!
    createdAt: DateTime!
  }

  input MeetingTypeInput {
    title: String!
    slug: String!
    description: String
    durationMinutes: Int!
    location: String
    timezone: String!
    weeklyHours: [MeetingWeeklyHoursInput!]!
    bufferMinutes: Int!
    minNoticeHours: Int!
    maxDaysAhead: Int!
    active: Boolean!
  }

  enum MeetingBookingStatus {
    CONFIRMED
    CANCELLED
  }

  type MeetingBooking {
    id: ID!
    meetingTypeId: String!
    meetingTitle: String!
    hostName: String!
    startAt: DateTime!
    endAt: DateTime!
    name: String!
    email: String!
    notes: String!
    guests: [String!]!
    timezone: String!
    status: MeetingBookingStatus!
    contactId: String!
    createdAt: DateTime!
  }

  type MeetingBookingPage {
    rows: [MeetingBooking!]!
    totalCount: Int!
  }

  "What the public booking page shows before anything is booked."
  type PublicMeeting {
    slug: String!
    title: String!
    description: String!
    durationMinutes: Int!
    hostName: String!
    timezone: String!
    organizationName: String!
    organizationSlug: String!
    "Whether a location is shared once the meeting is booked."
    hasLocation: Boolean!
  }

  "A company's booking page: every meeting it takes bookings for."
  type PublicBookingPage {
    organizationName: String!
    organizationSlug: String!
    meetings: [PublicMeeting!]!
  }

  type BookedMeeting {
    title: String!
    hostName: String!
    startAt: DateTime!
    endAt: DateTime!
    "Where it happens, now that it is booked."
    location: String!
  }

  input BookMeetingInput {
    startAt: DateTime!
    name: String!
    email: String!
    notes: String
    "The booker's IANA time zone, for their confirmation email."
    timezone: String
    "Others to invite (at most 10); each gets the confirmation."
    guests: [String!]
  }

  extend type Query {
    meetingTypes: [MeetingType!]!
    meetingBookings(page: Int!, pageSize: Int!): MeetingBookingPage!
    "The path of this company's booking page on the CRM site: /book/<company>."
    meetingBookingPagePath: String!
    "Public: a company's booking page (/book/<org>)."
    publicBookingPage(org: String!): PublicBookingPage!
    "Public: the meeting behind a booking link (/book/<org>/<slug>)."
    publicMeeting(org: String!, slug: String!): PublicMeeting!
    "Public: the free starts between two times (at most 62 days apart)."
    publicMeetingSlots(org: String!, slug: String!, from: DateTime!, to: DateTime!): [DateTime!]!
  }

  extend type Mutation {
    createMeetingType(input: MeetingTypeInput!): MeetingType!
    updateMeetingType(id: ID!, input: MeetingTypeInput!): MeetingType!
    deleteMeetingType(id: ID!): Boolean!
    cancelMeetingBooking(id: ID!): MeetingBooking!
    "Public: books a free start from a booking link."
    bookMeeting(org: String!, slug: String!, input: BookMeetingInput!): BookedMeeting!
  }
`;

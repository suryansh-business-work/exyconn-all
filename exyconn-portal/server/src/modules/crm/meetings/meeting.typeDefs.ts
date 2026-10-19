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
    "The public link's path inside the company's CRM address: /book/<page>/<slug>."
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
    "ISO country of the booker's time zone; empty when it names none."
    country: String!
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
    "The company's logo (Admin > Branding); empty when it has none."
    logoUrl: String!
    logoDarkUrl: String!
    "Whether a location is shared once the meeting is booked."
    hasLocation: Boolean!
  }

  "A company's booking page: every meeting it takes bookings for."
  type PublicBookingPage {
    organizationName: String!
    organizationSlug: String!
    logoUrl: String!
    logoDarkUrl: String!
    meetings: [PublicMeeting!]!
  }

  type BookedMeeting {
    title: String!
    hostName: String!
    startAt: DateTime!
    endAt: DateTime!
    "Where it happens, now that it is booked."
    location: String!
    "The fixed video rooms from Meeting settings, e.g. 'Zoom: https://zoom.us/j/1'."
    joinLinks: [String!]!
  }

  "CRM > Meetings > Settings: the booking page address, Slack and the fixed video rooms."
  type MeetingSettings {
    "The page's part of /organization/<company>/book/<slug>; 'meeting' by default."
    bookingSlug: String!
    "Slack channel id each booking is posted to; empty posts nowhere."
    slackChannel: String!
    googleMeetUrl: String!
    zoomUrl: String!
  }

  input MeetingSettingsInput {
    bookingSlug: String!
    slackChannel: String
    googleMeetUrl: String
    zoomUrl: String
  }

  enum MeetingVisitKind {
    VIEW
    BOOKED
  }

  "Views and bookings for one value (a country, a meeting, a day)."
  type MeetingTrackingCountry {
    country: String!
    countryName: String!
    views: Int!
    bookings: Int!
  }

  type MeetingTrackingMeeting {
    "The meeting's link part; empty for the booking page itself."
    meetingSlug: String!
    views: Int!
    bookings: Int!
  }

  type MeetingTrackingDay {
    "yyyy-MM-dd, UTC."
    day: String!
    views: Int!
    bookings: Int!
  }

  "One visit or booking: no IP address, cookie or name is ever kept."
  type MeetingTrackingVisit {
    id: ID!
    kind: MeetingVisitKind!
    meetingSlug: String!
    country: String!
    countryName: String!
    at: DateTime!
  }

  "CRM > Meetings > Tracking over the last few days."
  type MeetingTracking {
    days: Int!
    views: Int!
    bookings: Int!
    byCountry: [MeetingTrackingCountry!]!
    byMeeting: [MeetingTrackingMeeting!]!
    byDay: [MeetingTrackingDay!]!
    recent: [MeetingTrackingVisit!]!
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
    "The path of this company's booking page inside its CRM address: /book/<page>."
    meetingBookingPagePath: String!
    meetingSettings: MeetingSettings!
    "Slack channels a booking can be posted to (needs Tech > Environment Variables > Slack)."
    meetingSlackChannels: [SlackChannel!]!
    "Booking page views and bookings over the last 1-365 days."
    meetingTracking(days: Int!): MeetingTracking!
    "Public: a company's booking page (/organization/<org>/book/<page>)."
    publicBookingPage(org: String!, page: String!): PublicBookingPage!
    "Public: the meeting behind a booking link (/organization/<org>/book/<page>/<slug>)."
    publicMeeting(org: String!, page: String!, slug: String!): PublicMeeting!
    "Public: the free starts between two times (at most 62 days apart)."
    publicMeetingSlots(
      org: String!
      page: String!
      slug: String!
      from: DateTime!
      to: DateTime!
    ): [DateTime!]!
  }

  extend type Mutation {
    createMeetingType(input: MeetingTypeInput!): MeetingType!
    updateMeetingType(id: ID!, input: MeetingTypeInput!): MeetingType!
    deleteMeetingType(id: ID!): Boolean!
    cancelMeetingBooking(id: ID!): MeetingBooking!
    "Changing the booking page address stops the old one working."
    saveMeetingSettings(input: MeetingSettingsInput!): MeetingSettings!
    "Public: books a free start from a booking link."
    bookMeeting(
      org: String!
      page: String!
      slug: String!
      input: BookMeetingInput!
    ): BookedMeeting!
    "Public: counts one visit to the booking page (slug '') or a meeting; keeps no personal data."
    trackMeetingView(org: String!, page: String!, slug: String!, timezone: String): Boolean!
  }
`;

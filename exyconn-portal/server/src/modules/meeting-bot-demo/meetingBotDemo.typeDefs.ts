import gql from 'graphql-tag';

/** The meeting bot demo on demos.exyconn.com/meeting-bot-demo. */
export const meetingBotDemoTypeDefs = gql`
  "What the meeting bot demo offers the caller before anything is sent."
  type MeetingBotDemoInfo {
    "False until the meeting bot service is set up on this server."
    enabled: Boolean!
    "The name the bot joins calls under."
    botName: String!
    tripsPerDay: Int!
    tripsLeftToday: Int!
    "Days before a demo recording, transcript and notes are deleted."
    retentionDays: Int!
    "The longest stretch of a call the bot records."
    maxMeetingMinutes: Int!
    "The recording terms the caller agrees to before sending the bot."
    consentText: String!
  }

  "One action item from a demo meeting's notes."
  type MeetingBotDemoAction {
    id: ID!
    title: String!
    assignedTo: String
    dueDate: DateTime
    "The deadline as it was said, when it could not be pinned to a date."
    dueText: String
  }

  "A demo meeting's notes."
  type MeetingBotDemoSummary {
    title: String!
    executiveSummary: String!
    discussionPoints: [String!]!
    decisions: [String!]!
    actionItems: [MeetingBotDemoAction!]!
  }

  "One trip of the demo meeting bot into the caller's Google Meet call, and its notes once ready."
  type MeetingBotDemoTrip {
    id: ID!
    meetingCode: String!
    meetUrl: String!
    status: MaBotStatus!
    "Why the trip failed, when it did."
    error: String!
    createdAt: DateTime!
    finishedAt: DateTime
    "Where the notes are: NOT_STARTED, QUEUED, RUNNING, READY, FAILED or SKIPPED."
    summaryStatus: String!
    summary: MeetingBotDemoSummary
    "When the notes were emailed to the caller."
    emailedAt: DateTime
    "When the recording, transcript and notes are deleted."
    purgeAfter: DateTime!
    purged: Boolean!
  }

  extend type Query {
    "Public demo (demo visitor pass or employee): the bot's name, the daily limit left, the retention and the recording terms."
    meetingBotDemoInfo: MeetingBotDemoInfo!
    "Public demo: the caller's own demo bot trips, newest first, with their notes once ready."
    meetingBotDemoTrips: [MeetingBotDemoTrip!]!
    "Public demo: one of the caller's own demo bot trips."
    meetingBotDemoTrip("The trip's id." id: ID!): MeetingBotDemoTrip!
  }

  extend type Mutation {
    "Public demo: sends the meeting bot into the caller's Google Meet call. The caller must agree to the recording terms; limited per day."
    sendMeetingBotDemo(
      "The call's Google Meet link, e.g. https://meet.google.com/abc-defg-hij."
      meetUrl: String!
      "True when the caller agreed to the recording terms shown in meetingBotDemoInfo."
      consent: Boolean!
    ): MeetingBotDemoTrip!
    "Public demo: calls the bot back from one of the caller's own trips."
    cancelMeetingBotDemo("The trip's id." id: ID!): MeetingBotDemoTrip!
  }
`;

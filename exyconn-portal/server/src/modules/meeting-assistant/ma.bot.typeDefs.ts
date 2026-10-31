import gql from 'graphql-tag';

/** The meeting bot: sent into a Google Meet call to record it for its owner. */
export const maBotTypeDefs = gql`
  "Where a meeting bot trip is."
  enum MaBotStatus {
    "Waiting for a free bot (or for the calendar event's start)."
    QUEUED
    "A bot is opening the call."
    JOINING
    "The bot is in the lobby, waiting for the host to admit it."
    WAITING_ADMIT
    "The bot is in the call, recording."
    IN_CALL
    DONE
    FAILED
    CANCELLED
  }

  "Who sent the bot: a person, or the calendar scan before an event."
  enum MaBotSource {
    MANUAL
    CALENDAR
  }

  "One trip of the meeting bot into a call, recorded as the owner's meeting."
  type MaBotDispatch {
    id: ID!
    ownerId: String!
    ownerName: String!
    meetingCode: String!
    meetUrl: String!
    title: String!
    source: MaBotSource!
    status: MaBotStatus!
    "The meeting the bot recorded, once it is in the call."
    meetingId: ID
    "Why the trip failed, when it did."
    error: String!
    joinAt: DateTime!
    createdAt: DateTime!
    finishedAt: DateTime
  }

  extend type Query {
    "The latest meeting bot trips (newest first, up to 50): your own (MINE), or the company's (ALL, AI role or ADMIN)."
    maBotDispatches(
      "MINE for your own trips (the default), ALL for the whole company."
      scope: MaScope
    ): [MaBotDispatch!]!
  }

  extend type Mutation {
    "Sends the meeting bot into a Google Meet call now, to record and transcribe it as your meeting. The bot announces itself in the call's chat."
    maSendBot(
      "The call's Google Meet link, e.g. https://meet.google.com/abc-defg-hij."
      meetUrl: String!
      "A title for the meeting; Meet's own title is used when empty."
      title: String
    ): MaBotDispatch!
    "Calls a meeting bot back: a queued trip never starts and a bot in the call leaves. Your own trips, or any with the company scope."
    maCancelBot("The bot trip's id." id: ID!): MaBotDispatch!
  }
`;

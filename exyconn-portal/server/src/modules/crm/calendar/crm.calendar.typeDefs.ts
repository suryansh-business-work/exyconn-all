import gql from 'graphql-tag';

/** CRM reminders on activities, and the calendar that shows them (see crm.calendar.ts). */
export const crmCalendarTypeDefs = gql`
  extend type Activity {
    "When the assignee is emailed about it; null when nobody asked for a reminder."
    remindAt: DateTime
    "The user the reminder email goes to; empty without a reminder."
    assigneeId: String!
    assigneeName: String!
    "When the reminder went out; null until then, and again after its time is moved."
    reminderSentAt: DateTime
  }

  extend input ActivityInput {
    "Set to email the assignee at this time (must be in the future); null removes the reminder."
    remindAt: DateTime
    "The user to remind; required with remindAt."
    assigneeId: String
  }

  "What a calendar entry is, which decides its colour."
  enum CrmCalendarKind {
    REMINDER
    TASK
    MEETING
    ACTIVITY
    BOOKING
  }

  "One dated thing on the CRM calendar."
  type CrmCalendarItem {
    "The activity's id, or booking:<id> for a meeting booking."
    id: ID!
    kind: CrmCalendarKind!
    title: String!
    startAt: DateTime!
    endAt: DateTime
    done: Boolean!
    relatedType: ActivitySubject
    relatedId: String!
    relatedName: String!
    "The assignee, the owner or the meeting's host."
    person: String!
  }

  extend type Query {
    "Reminders, dated activities and meeting bookings from from (inclusive) to to (exclusive); at most 62 days."
    crmCalendar(from: DateTime!, to: DateTime!): [CrmCalendarItem!]!
  }
`;

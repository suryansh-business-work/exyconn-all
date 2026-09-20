import gql from 'graphql-tag';

export const notificationsTypeDefs = gql`
  enum NotificationKind {
    ANNOUNCEMENT
    LEAVE
    PAYROLL
    GOAL
    PERFORMANCE
    REQUEST
    TRAINING
    ONBOARDING
    SOCIAL_LIKE
    SOCIAL_COMMENT
    SOCIAL_SHARE
    SUPPORT
    IT
    FINANCE
    CRM
    PROJECT
    LEGAL
    COMPLIANCE
    GENERAL
  }

  type Notification {
    id: ID!
    kind: NotificationKind!
    title: String!
    body: String!
    link: String
    read: Boolean!
    createdAt: DateTime!
  }

  enum NotificationAudience {
    ALL
    DEPARTMENT
    EMPLOYEES
  }

  input SendNotificationInput {
    kind: NotificationKind!
    title: String!
    body: String
    "In-portal path the notification opens, e.g. /me/announcements."
    link: String
    audience: NotificationAudience!
    "Required when audience is DEPARTMENT."
    department: String
    "Required when audience is EMPLOYEES."
    employeeIds: [String!]
  }

  type SendNotificationResult {
    recipients: Int!
  }

  "One kind of notification, and where this person wants it."
  type NotificationPreference {
    kind: NotificationKind!
    "Shown in the bell and the notification centre."
    inPortal: Boolean!
    "Also sent as an email. Off unless somebody asked for it."
    email: Boolean!
  }

  input NotificationPreferenceInput {
    kind: NotificationKind!
    inPortal: Boolean!
    email: Boolean!
  }

  extend type Query {
    myNotifications: [Notification!]!
    myUnreadNotificationCount: Int!
    "Every kind, with this person's choice or the default where they have made none."
    myNotificationPreferences: [NotificationPreference!]!
  }

  extend type Mutation {
    markNotificationRead(id: ID!): Boolean!
    markAllNotificationsRead: Int!
    "HR broadcast to every active employee, one department, or a chosen list."
    sendNotification(input: SendNotificationInput!): SendNotificationResult!
    "Sets where one kind reaches this person. Returns the whole set, so a screen stays in step."
    setMyNotificationPreference(input: NotificationPreferenceInput!): [NotificationPreference!]!
  }
`;

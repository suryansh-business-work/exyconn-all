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

  extend type Query {
    myNotifications: [Notification!]!
    myUnreadNotificationCount: Int!
  }

  extend type Mutation {
    markNotificationRead(id: ID!): Boolean!
    markAllNotificationsRead: Int!
    "HR broadcast to every active employee, one department, or a chosen list."
    sendNotification(input: SendNotificationInput!): SendNotificationResult!
  }
`;

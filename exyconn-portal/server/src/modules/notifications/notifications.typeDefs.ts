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

  extend type Query {
    myNotifications: [Notification!]!
    myUnreadNotificationCount: Int!
  }

  extend type Mutation {
    markNotificationRead(id: ID!): Boolean!
    markAllNotificationsRead: Int!
  }
`;

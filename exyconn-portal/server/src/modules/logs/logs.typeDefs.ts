import gql from 'graphql-tag';

export const logsTypeDefs = gql`
  enum AppLogSource {
    PORTAL
    DESKTOP
    MOBILE
    SERVER
  }
  enum AppLogLevel {
    ERROR
    WARN
    INFO
    DEBUG
  }
  enum AppLogStatus {
    OPEN
    RESOLVED
    IGNORED
  }

  "What the app did just before a log, oldest first."
  type AppLogBreadcrumb {
    at: DateTime!
    level: AppLogLevel!
    message: String!
  }

  "Every occurrence of one distinct problem, folded into one row."
  type AppLogGroup {
    id: ID!
    source: AppLogSource!
    "Which app: a portal name (tech, hr), tracker-desktop, tracker-mobile or portal-server."
    app: String!
    level: AppLogLevel!
    errorName: String!
    message: String!
    "The stack of the most recent occurrence."
    stack: String!
    route: String!
    status: AppLogStatus!
    count: Int!
    userCount: Int!
    lastUserName: String!
    lastUserEmail: String!
    platform: String!
    appVersion: String!
    firstSeenAt: DateTime!
    lastSeenAt: DateTime!
    resolvedAt: DateTime
  }

  type AppLogGroupPage {
    rows: [AppLogGroup!]!
    totalCount: Int!
  }

  "One occurrence: who, when, on which device and build, and what led up to it."
  type AppLogEvent {
    id: ID!
    level: AppLogLevel!
    message: String!
    stack: String!
    componentStack: String!
    route: String!
    context: String!
    breadcrumbs: [AppLogBreadcrumb!]!
    "Identical entries the client folded into this one."
    count: Int!
    occurredAt: DateTime!
    createdAt: DateTime!
    userId: String!
    userName: String!
    userEmail: String!
    "False when the client named the user but sent no valid session."
    userVerified: Boolean!
    deviceId: String!
    platform: String!
    osVersion: String!
    deviceModel: String!
    appVersion: String!
    sessionId: String!
    userAgent: String!
    ip: String!
  }

  input AppLogBreadcrumbInput {
    at: DateTime!
    level: AppLogLevel!
    message: String!
  }

  input AppLogEntryInput {
    level: AppLogLevel!
    message: String!
    errorName: String
    stack: String
    componentStack: String
    route: String
    "JSON text."
    context: String
    count: Int
    occurredAt: DateTime!
    breadcrumbs: [AppLogBreadcrumbInput!]
  }

  "The last signed-in user the client knew of — used only when the request carries no session."
  input AppLogUserInput {
    id: String!
    name: String!
    email: String!
  }

  input AppLogBatchInput {
    source: AppLogSource!
    app: String!
    appVersion: String
    platform: String
    osVersion: String
    deviceModel: String
    deviceId: String
    sessionId: String
    user: AppLogUserInput
    entries: [AppLogEntryInput!]!
  }

  extend type Query {
    listAppLogGroupsPaged(input: TableQueryInput!): AppLogGroupPage!
    listAppLogGroupsStats: TableStats!
    getAppLogGroup(id: ID!): AppLogGroup!
    "The most recent occurrences of one group, newest first."
    listAppLogEvents(groupId: ID!): [AppLogEvent!]!
    "Markdown describing one group, ready to paste to Claude to fix."
    appLogFixPrompt(id: ID!): String!
    "Markdown describing every OPEN error (optionally from one source), ready to paste to Claude."
    openAppLogsFixPrompt(source: AppLogSource): String!
  }

  extend type Mutation {
    """
    Public, so a crash on the login screen still reaches us. The user is read from the
    session when there is one. Rate-limited per user, else per IP.
    """
    reportClientLogs(input: AppLogBatchInput!): Boolean!
    setAppLogGroupStatus(id: ID!, status: AppLogStatus!): AppLogGroup!
    "Deletes the group and every stored occurrence of it."
    deleteAppLogGroup(id: ID!): Boolean!
  }
`;

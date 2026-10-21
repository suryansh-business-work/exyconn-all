import gql from 'graphql-tag';

export const auditTypeDefs = gql`
  enum AuditAction {
    CREATE
    UPDATE
    DELETE
    LOGIN
    ROLE_CHANGE
    PASSWORD_RESET
    SETTINGS
    PERMISSION
    ACCESS
    IMPORT
  }

  "One thing somebody changed. Append-only; read from Admin > Audit Log."
  type AuditLog {
    id: ID!
    actorId: String!
    actorName: String!
    actorEmail: String!
    action: AuditAction!
    module: String!
    entityId: String!
    entityLabel: String!
    summary: String!
    "JSON string of { field: { from, to } }; empty when the action is not an update."
    changes: String!
    ip: String!
    createdAt: DateTime!
  }

  type AuditLogPage {
    rows: [AuditLog!]!
    totalCount: Int!
  }

  extend type Query {
    listAuditLogsPaged(input: TableQueryInput!): AuditLogPage!
    listAuditLogsStats: TableStats!
    "What one person did, newest first: their own, or anyone's for ADMIN and HR."
    listUserActivityPaged(userId: ID!, input: TableQueryInput!): AuditLogPage!
  }
`;

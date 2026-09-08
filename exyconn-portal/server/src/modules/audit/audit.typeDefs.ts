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
  }
`;

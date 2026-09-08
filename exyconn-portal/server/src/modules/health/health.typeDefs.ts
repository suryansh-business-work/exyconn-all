import gql from 'graphql-tag';

/**
 * Admin › System Health: is this deployment alive and are its background loops
 * running. Every field is measured when the query runs — nothing here is stored,
 * so a stale answer is impossible.
 */
export const healthTypeDefs = gql`
  "The MongoDB this server is connected to, as the server itself reports it."
  type HealthMongo {
    "False when the connection is not ready; every other field is then zero."
    ok: Boolean!
    dbName: String!
    collections: Int!
    dataSizeMb: Float!
  }

  "One background loop, and when it last completed a tick in this process."
  type HealthJob {
    key: String!
    label: String!
    "Whether the loop has work to do at all — a schedule switched off is not a fault."
    enabled: Boolean!
    "Null until the loop has run once since this process started."
    lastRunAt: DateTime
    lastRunSummary: String!
  }

  "A headline number the console shows next to the runtime figures."
  type HealthCount {
    label: String!
    value: Int!
  }

  type SystemHealth {
    "The server package's own version, read from its package.json."
    serverVersion: String!
    nodeVersion: String!
    uptimeSeconds: Int!
    mongo: HealthMongo!
    jobs: [HealthJob!]!
    counts: [HealthCount!]!
  }

  extend type Query {
    "Admin only — the deployment's own vital signs."
    systemHealth: SystemHealth!
  }
`;

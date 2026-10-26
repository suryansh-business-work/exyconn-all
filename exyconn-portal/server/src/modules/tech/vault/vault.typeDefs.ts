import gql from 'graphql-tag';

export const techVaultTypeDefs = gql`
  "Whether the browser shared the device's position when the vault was opened."
  enum VaultLocationState {
    GRANTED
    DENIED
    UNAVAILABLE
  }

  enum VaultEndReason {
    EXPIRED
    LOCKED
  }

  type VaultLocation {
    state: VaultLocationState!
    latitude: Float
    longitude: Float
    "Metres, as the browser reported it."
    accuracy: Float
  }

  "One unlock of Tech > Environment Variables: who, why, from where, and until when."
  type TechVaultSession {
    id: ID!
    userId: String!
    userName: String!
    email: String!
    reason: String!
    ip: String!
    userAgent: String!
    location: VaultLocation!
    unlockedAt: DateTime!
    expiresAt: DateTime!
    endedAt: DateTime
    endReason: VaultEndReason
  }

  type TechVaultSessionPage {
    rows: [TechVaultSession!]!
    totalCount: Int!
  }

  input VaultLocationInput {
    state: VaultLocationState!
    latitude: Float
    longitude: Float
    accuracy: Float
  }

  input UnlockTechVaultInput {
    code: String!
    reason: String!
    location: VaultLocationInput!
  }

  extend type Query {
    "The caller's open Environment Variables session; null while locked."
    techVaultStatus: TechVaultSession
    "Every unlock, newest first."
    techVaultSessionsPaged(input: TableQueryInput!): TechVaultSessionPage!
    "What was changed or revealed in Tech configuration during one session."
    techVaultSessionActivity(id: ID!): [AuditLog!]!
  }

  extend type Mutation {
    "Emails a one-time code to the address the caller signs in with."
    requestTechVaultCode: Boolean!
    "Opens Environment Variables for 30 minutes."
    unlockTechVault(input: UnlockTechVaultInput!): TechVaultSession!
    "Locks Environment Variables again now."
    lockTechVault: Boolean!
  }
`;

import gql from 'graphql-tag';

export const suppressionTypeDefs = gql`
  "Why an address is on the marketing suppression list. BOUNCED is a hard bounce."
  enum SuppressionReason {
    UNSUBSCRIBED
    BOUNCED
    MANUAL
    SPAM_COMPLAINT
    DO_NOT_CONTACT
    OTHER
  }

  "What wrote the row, set by the server from the action — never chosen."
  enum SuppressionOrigin {
    ADMIN
    CRM
    CAMPAIGN
    SUBSCRIBER
    IMPORT
    API
    SYSTEM
  }

  "What a suppression stops: all of the organization's marketing, never transactional mail."
  enum SuppressionScope {
    ORGANIZATION_MARKETING
  }

  "A contact or company holding a suppressed address, with all of its addresses."
  type SuppressionLink {
    kind: AudienceRecordKind!
    id: String!
    name: String!
    emails: [String!]!
  }

  "One address marketing must never write to again. Archived rows still block sends."
  type MarketingSuppression {
    id: ID!
    email: String!
    reason: SuppressionReason!
    "Detail of where it came from — a campaign or contact id — or legacy free text."
    source: String!
    origin: SuppressionOrigin!
    scope: SuppressionScope!
    note: String!
    addedByName: String!
    archivedAt: DateTime
    "Read live from the CRM; only on the paged list and the lookup."
    linkedRecords: [SuppressionLink!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input MarketingSuppressionInput {
    email: String!
    reason: SuppressionReason!
    note: String
    "Hide it from the list straight away. It is suppressed either way."
    archived: Boolean
  }

  input MarketingSuppressionsInput {
    emails: [String!]!
    reason: SuppressionReason!
    note: String
    "True when the addresses were read from an uploaded file (origin IMPORT)."
    fromFile: Boolean
  }

  type MarketingSuppressionsResult {
    added: [String!]!
    alreadySuppressed: [String!]!
    invalid: [String!]!
  }

  type MarketingSuppressionPage {
    rows: [MarketingSuppression!]!
    totalCount: Int!
  }

  "The list's headline figures. Each address is counted once; archived rows count."
  type MarketingSuppressionSummary {
    total: Int!
    archived: Int!
    unsubscribed: Int!
    hardBounced: Int!
    addedManually: Int!
    updatedAt: DateTime
  }

  "What adding an address would touch."
  type MarketingSuppressionLookup {
    email: String!
    existing: MarketingSuppression
    linkedRecords: [SuppressionLink!]!
  }

  extend type Query {
    listMarketingSuppressions: [MarketingSuppression!]!
    listMarketingSuppressionsPaged(input: TableQueryInput!): MarketingSuppressionPage!
    listMarketingSuppressionsStats: TableStats!
    getMarketingSuppression(id: ID!): MarketingSuppression!
    "Reads the suppression list's headline counts: total, archived, unsubscribed, hard-bounced and added by hand."
    marketingSuppressionSummary: MarketingSuppressionSummary!
    "Checks one address before suppressing it: its existing suppression row, if any, and the CRM records that hold it."
    marketingSuppressionLookup(email: String!): MarketingSuppressionLookup!
    "Every recorded change to an address, newest first — kept after a removal too."
    marketingSuppressionHistory(email: String!): [AuditLog!]!
  }

  extend type Mutation {
    createMarketingSuppression(input: MarketingSuppressionInput!): MarketingSuppression!
    "Adds up to 5000 addresses to the suppression list so no campaign emails them; reports which were added, already suppressed or invalid. Confirm with the person first."
    addMarketingSuppressions(input: MarketingSuppressionsInput!): MarketingSuppressionsResult!
    "Replaces the note on a suppressed address. The address stays suppressed."
    updateMarketingSuppressionNote(
      id: ID!
      "The new note; replaces the old one."
      note: String!
    ): MarketingSuppression!
    "Archives or unarchives a suppression row. An archived address is still suppressed."
    setMarketingSuppressionArchived(
      id: ID!
      "True to archive, false to unarchive."
      archived: Boolean!
    ): MarketingSuppression!
    "Lets campaigns reach the address again. Needs a reason; consent withdrawals need an administrator."
    removeMarketingSuppression(id: ID!, justification: String!): Boolean!
  }
`;

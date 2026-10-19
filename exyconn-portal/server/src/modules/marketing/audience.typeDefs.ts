import gql from 'graphql-tag';

export const audienceTypeDefs = gql`
  "Which CRM registers the rules pick from. SELECTED_ONLY uses only the records named under Data sources."
  enum AudienceRecipientSource {
    CONTACTS
    COMPANIES
    BOTH
    SELECTED_ONLY
  }

  "Where a matching company's addresses come from."
  enum AudienceCompanyEmailSource {
    COMPANY_EMAILS
    LINKED_CONTACTS
    BOTH
  }

  "How many of a record's addresses are used."
  enum AudienceEmailSelection {
    PRIMARY
    ALL
    SELECTED_TYPES
  }

  "Whether membership is frozen at save (addresses, or records) or follows the CRM."
  enum AudienceUpdateMode {
    FIXED_SNAPSHOT
    FIXED_RECORDS
    DYNAMIC
  }

  enum AudienceRuleCombinator {
    AND
    OR
  }

  enum AudienceRuleOperator {
    EQUALS
    NOT_EQUALS
    CONTAINS
    IS_EMPTY
    IS_NOT_EMPTY
    NEVER
    WITHIN_DAYS
    OLDER_THAN_DAYS
  }

  enum AudienceFilterEntity {
    CONTACT
    COMPANY
    EMAIL
  }

  enum AudienceFilterKind {
    ENUM
    TEXT
    TAGS
    LAST_CONTACTED
    EMAIL_STATUS
  }

  enum AudienceRecordKind {
    CONTACT
    COMPANY
    CLIENT
  }

  "How a record got into the audience."
  enum AudienceRecordVia {
    RULES
    LINKED_CONTACT
    SELECTED
  }

  "Why an address will not be sent to. UNSUBSCRIBED, SPAM_COMPLAINT, BOUNCED and BLOCKED are never overridden."
  enum AudienceExclusionReason {
    UNSUBSCRIBED
    SPAM_COMPLAINT
    CATEGORY_OPT_OUT
    BOUNCED
    BLOCKED
    INVALID_EMAIL
    LEFT_COMPANY
    MANUALLY_EXCLUDED
    EMAIL_STATUS_FILTER
  }

  type AudienceCondition {
    field: String!
    operator: AudienceRuleOperator!
    value: String!
  }

  input AudienceConditionInput {
    field: String!
    operator: AudienceRuleOperator!
    value: String
  }

  "A saved set of campaign recipients: CRM rules, named records and how addresses are picked."
  type AudienceList {
    id: ID!
    name: String!
    description: String!
    recipientSource: AudienceRecipientSource!
    companyEmailSource: AudienceCompanyEmailSource!
    emailSelection: AudienceEmailSelection!
    emailTypes: [String!]!
    updateMode: AudienceUpdateMode!
    ruleCombinator: AudienceRuleCombinator!
    conditions: [AudienceCondition!]!
    clientIds: [String!]!
    contactIds: [String!]!
    companyIds: [String!]!
    allActiveClients: Boolean!
    excludedEmails: [String!]!
    "When a fixed audience was frozen; null for a dynamic one."
    snapshotAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input AudienceListInput {
    name: String!
    description: String
    recipientSource: AudienceRecipientSource!
    companyEmailSource: AudienceCompanyEmailSource!
    emailSelection: AudienceEmailSelection!
    emailTypes: [String!]
    updateMode: AudienceUpdateMode!
    ruleCombinator: AudienceRuleCombinator!
    conditions: [AudienceConditionInput!]
    clientIds: [String!]
    contactIds: [String!]
    companyIds: [String!]
    allActiveClients: Boolean
    excludedEmails: [String!]
  }

  type AudienceListPage {
    rows: [AudienceList!]!
    totalCount: Int!
  }

  "One field an audience rule can test, with the operators it allows."
  type AudienceFilterField {
    key: String!
    label: String!
    entity: AudienceFilterEntity!
    kind: AudienceFilterKind!
    operators: [AudienceRuleOperator!]!
    "The fixed values of an ENUM or EMAIL_STATUS field; empty for the others."
    values: [String!]!
  }

  type AudienceFilterCatalogue {
    fields: [AudienceFilterField!]!
    "Every address label in use on contacts and companies, e.g. Work, Sales, Support."
    emailTypes: [String!]!
  }

  "Every count of an audience, worked out on the server."
  type AudienceCounts {
    contacts: Int!
    companies: Int!
    clients: Int!
    recordsWithoutEmail: Int!
    "Addresses picked from the records, before de-duplication."
    rawEmails: Int!
    duplicates: Int!
    uniqueEmails: Int!
    invalid: Int!
    "Unsubscribed, bounced or blocked."
    suppressed: Int!
    "Turned off the campaign's preference category; 0 without a campaign."
    optedOut: Int!
    "Left the company, excluded by hand, or filtered out by email status."
    excluded: Int!
    "Unique addresses a send will go to."
    eligible: Int!
  }

  "A record behind an address."
  type AudienceRecipientOrigin {
    kind: AudienceRecordKind!
    id: String!
    name: String!
    via: AudienceRecordVia!
  }

  "One unique address in an audience and whether it will be sent to."
  type AudienceRecipient {
    email: String!
    name: String!
    company: String!
    label: String!
    verification: String!
    sources: [AudienceRecipientOrigin!]!
    exclusion: AudienceExclusionReason
  }

  type AudienceRecipientPage {
    rows: [AudienceRecipient!]!
    totalCount: Int!
  }

  "Who an audience reaches right now."
  type AudienceResolution {
    counts: AudienceCounts!
    resolvedAt: DateTime!
    "One page of the recipients, searched by address, name or company."
    recipients(input: TableQueryInput!): AudienceRecipientPage!
  }

  extend type Query {
    listAudienceLists: [AudienceList!]!
    listAudienceListsPaged(input: TableQueryInput!): AudienceListPage!
    getAudienceList(id: ID!): AudienceList!
    "The fields audience rules can test, and the address labels in use."
    audienceFilterCatalogue: AudienceFilterCatalogue!
    "The values in use for a text or tag field, for the rule builder's suggestions."
    audienceFilterValues(field: String!): [String!]!
    "What an unsaved audience would reach, always resolved live."
    previewAudience(input: AudienceListInput!): AudienceResolution!
    "What a saved audience reaches now, honouring its fixed snapshot — for a campaign's preference category when given."
    audienceResolution(id: ID!, categoryId: String): AudienceResolution!
  }

  extend type Mutation {
    "Saves the audience; a fixed one is frozen at the moment it is saved."
    createAudienceList(input: AudienceListInput!): AudienceList!
    updateAudienceList(id: ID!, input: AudienceListInput!): AudienceList!
    deleteAudienceList(id: ID!): Boolean!
  }
`;

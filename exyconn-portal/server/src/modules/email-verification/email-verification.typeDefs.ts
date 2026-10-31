import gql from 'graphql-tag';

export const emailVerificationTypeDefs = gql`
  "What a check concluded: VERIFIED is a mailbox that exists and accepts email."
  enum EmailVerificationStatus {
    VERIFIED
    RISKY
    INVALID
    UNKNOWN
  }

  enum EmailVerificationSource {
    SINGLE
    BULK
    CRM
  }

  "The latest check of one address."
  type EmailVerification {
    id: ID!
    email: String!
    status: EmailVerificationStatus!
    "Why, in one line."
    reason: String!
    syntaxValid: Boolean!
    hasMx: Boolean!
    deliverable: Boolean!
    catchAll: Boolean!
    disposable: Boolean!
    roleAccount: Boolean!
    "A likely typo fix, e.g. gmail.com for gmial.com."
    suggestion: String!
    source: EmailVerificationSource!
    checkedAt: DateTime!
    checkedBy: String!
  }

  type EmailVerificationPage {
    rows: [EmailVerification!]!
    totalCount: Int!
  }

  enum EmailVerificationBatchStatus {
    QUEUED
    RUNNING
    DONE
    FAILED
  }

  "A bulk check from an uploaded CSV, worked through in the background."
  type EmailVerificationBatch {
    id: ID!
    name: String!
    total: Int!
    processed: Int!
    status: EmailVerificationBatchStatus!
    verified: Int!
    risky: Int!
    invalid: Int!
    unknown: Int!
    createdBy: String!
    createdAt: DateTime!
    finishedAt: DateTime
  }

  "How the verifier reaches mail servers (Tech > Environment Variables). The password is write-only."
  type EmailVerifierConfig {
    id: ID!
    label: String!
    proxyHost: String!
    proxyPort: Int!
    proxyUsername: String!
    hasProxyPassword: Boolean!
    isActive: Boolean!
    updatedAt: DateTime!
  }

  input EmailVerifierConfigInput {
    label: String!
    proxyHost: String!
    proxyPort: Int!
    proxyUsername: String!
    "Write-only. Leave empty when editing to keep the stored password."
    proxyPassword: String!
    isActive: Boolean
  }

  extend type Contact {
    "The latest check of this contact's email; null when it was never checked."
    emailVerification: EmailVerification
  }

  extend type Lead {
    "The latest check of this lead's email; null when it was never checked."
    emailVerification: EmailVerification
  }

  extend type CrmEmailAddress {
    "The latest check of this address; null when it was never checked."
    verification: EmailVerification
  }

  extend type Query {
    "Lists the email addresses that were checked and their latest result, one page at a time."
    emailVerificationsPaged(input: TableQueryInput!): EmailVerificationPage!
    "Lists the latest 50 CSV verification batches with their progress and counts of verified, risky, invalid and unknown addresses."
    emailVerificationBatches: [EmailVerificationBatch!]!
    emailVerifierConfigs: [EmailVerifierConfig!]!
  }

  extend type Mutation {
    "Checks one address now and keeps the result."
    verifyEmail(email: String!, source: EmailVerificationSource): EmailVerification!
    "Queues the addresses of an uploaded CSV for checking in the background."
    createEmailVerificationBatch(name: String!, emails: [String!]!): EmailVerificationBatch!
    createEmailVerifierConfig(input: EmailVerifierConfigInput!): EmailVerifierConfig!
    updateEmailVerifierConfig(id: ID!, input: EmailVerifierConfigInput!): EmailVerifierConfig!
    "Connects to the proxy and signs in; says what worked, or why not."
    testEmailVerifierConfig(id: ID!): String!
    deleteEmailVerifierConfig(id: ID!): Boolean!
  }
`;

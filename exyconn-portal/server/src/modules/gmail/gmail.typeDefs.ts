import gql from 'graphql-tag';

/** The CRM's Gmail: the connection on Tech, and emailing from a contact or company page. */
export const gmailTypeDefs = gql`
  "The shared Gmail mailbox the CRM sends from. Tokens never leave the server."
  type GmailConfig {
    id: ID!
    clientId: String!
    hasClientSecret: Boolean!
    clientSecretHint: String
    enabled: Boolean!
    connected: Boolean!
    "The mailbox Google connected; empty until then."
    connectedEmail: String!
    connectedAt: DateTime
    "Why the last call to Gmail failed; empty when it worked."
    lastError: String!
    "Register this exact address as an authorised redirect URI on the Google client."
    redirectUri: String!
    updatedAt: DateTime
  }

  input GmailConfigInput {
    clientId: String!
    "Blank keeps the stored secret."
    clientSecret: String!
    enabled: Boolean!
  }

  enum CrmEmailDirection {
    IN
    OUT
  }

  type CrmEmailMessage {
    id: ID!
    gmailId: String!
    threadId: String!
    messageId: String!
    direction: CrmEmailDirection!
    from: String!
    to: [String!]!
    cc: [String!]!
    subject: String!
    snippet: String!
    bodyText: String!
    sentAt: DateTime!
    sentByName: String!
  }

  type CrmEmailThread {
    threadId: ID!
    subject: String!
    lastAt: DateTime!
    messages: [CrmEmailMessage!]!
  }

  input SendCrmEmailInput {
    to: [String!]!
    cc: [String!]
    subject: String!
    body: String!
    "Replying: Gmail's thread id and the Message-ID being answered."
    threadId: String
    inReplyTo: String
  }

  input DraftCrmEmailInput {
    object: CrmTimelineObject!
    id: ID!
    threadId: String
    "What the email should say, in a few words."
    instruction: String!
  }

  extend type Query {
    gmailConfig: GmailConfig!
    "The record's Gmail threads, synced from Gmail first."
    crmEmailThreads(object: CrmTimelineObject!, id: ID!): [CrmEmailThread!]!
    "Whether the CRM can email through Gmail (connected, and this is the operator's CRM)."
    crmGmailReady: Boolean!
  }

  extend type Mutation {
    saveGmailConfig(input: GmailConfigInput!): GmailConfig!
    "Google's consent page to connect the mailbox; comes back to returnTo."
    startGmailConnect(returnTo: String!): String!
    disconnectGmail: GmailConfig!
    "Reads the mailbox's address with the stored connection."
    testGmailConfig: String!
    sendCrmEmail(input: SendCrmEmailInput!): CrmEmailMessage!
    "An AI draft of a new email or a reply, from the record and its thread."
    draftCrmEmail(input: DraftCrmEmailInput!): String!
    "An AI summary of everything that happened with the record."
    crmRecordSummary(object: CrmTimelineObject!, id: ID!): String!
  }
`;

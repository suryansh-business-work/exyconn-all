import gql from 'graphql-tag';

/**
 * The CRM's Gmail: the OAuth client on Tech, the mailboxes connected in CRM > Connect Gmail,
 * and emailing from a contact or company page.
 */
export const gmailTypeDefs = gql`
  "The Google OAuth client the CRM's Gmail accounts connect through. Secrets stay on the server."
  type GmailConfig {
    id: ID!
    clientId: String!
    hasClientSecret: Boolean!
    clientSecretHint: String
    enabled: Boolean!
    "How many Gmail accounts are connected in CRM > Connect Gmail."
    accountCount: Int!
    "Register this exact address as an authorised redirect URI on the Google client."
    redirectUri: String!
    updatedAt: DateTime
  }

  enum GmailAccountStatus {
    CONNECTED
    "Google refused the stored connection; connect the account again."
    NEEDS_RECONNECT
  }

  "A Gmail mailbox connected to the CRM. Its token never leaves the server."
  type GmailAccount {
    id: ID!
    email: String!
    "Whether the CRM reads and sends from it."
    enabled: Boolean!
    status: GmailAccountStatus!
    "Why the last call to Gmail failed; empty when it worked."
    lastError: String!
    connectedAt: DateTime
    connectedByName: String!
    lastSyncAt: DateTime
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
    "The connected account it was read from or sent by; empty on mail from before accounts."
    accountId: String!
    mailbox: String!
  }

  "One conversation in one connected mailbox (Gmail thread ids are per mailbox)."
  type CrmEmailThread {
    threadId: ID!
    accountId: String!
    "The connected mailbox the conversation is in."
    mailbox: String!
    subject: String!
    lastAt: DateTime!
    messages: [CrmEmailMessage!]!
  }

  input SendCrmEmailInput {
    "The connected Gmail or Microsoft mailbox to send from (crmEmailSenders); it has to be enabled for the CRM."
    fromAccountId: ID!
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
    "The record's Gmail threads across every enabled account, synced from Gmail first."
    crmEmailThreads(object: CrmTimelineObject!, id: ID!): [CrmEmailThread!]!
    "Whether the CRM can email through Gmail (an enabled account, and this is the operator's CRM)."
    crmGmailReady: Boolean!
    "The Gmail accounts connected to the CRM, newest first."
    gmailAccounts: [GmailAccount!]!
    "Whether Tech has saved and turned on the Google client the accounts connect through."
    gmailClientReady: Boolean!
    "The mailbox (Gmail or Microsoft) a new email to the record goes from by default; null when none is enabled."
    crmEmailSender(object: CrmTimelineObject!, id: ID!): ID
  }

  extend type Mutation {
    saveGmailConfig(input: GmailConfigInput!): GmailConfig!
    "Google's consent page to connect one more mailbox (or renew one); comes back to returnTo."
    startGmailConnect(returnTo: String!): String!
    "Turns an account on or off for the CRM."
    setGmailAccountEnabled(id: ID!, enabled: Boolean!): GmailAccount!
    "Removes the account and its token; mail already synced stays on the records."
    disconnectGmailAccount(id: ID!): Boolean!
    "Reads every enabled mailbox's address with its stored connection."
    testGmailConfig: String!
    sendCrmEmail(input: SendCrmEmailInput!): CrmEmailMessage!
    "An AI draft of a new email or a reply, from the record and its thread."
    draftCrmEmail(input: DraftCrmEmailInput!): String!
    "An AI summary of everything that happened with the record."
    crmRecordSummary(object: CrmTimelineObject!, id: ID!): String!
  }
`;

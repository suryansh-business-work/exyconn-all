import gql from 'graphql-tag';

/**
 * Personal mailboxes: a Gmail or Microsoft mailbox one person connects for their own email
 * (Settings > Mailboxes), sent from by the email window every portal opens on an address.
 * Separate from the company's CRM mailboxes, which only the CRM lists and sends from.
 */
export const myMailboxesTypeDefs = gql`
  "A mailbox the signed-in person connected for their own email. Its token never leaves the server."
  type MyMailbox {
    id: ID!
    provider: CrmEmailProvider!
    email: String!
    status: GmailAccountStatus!
    "Why the last call to the provider failed; empty when it worked."
    lastError: String!
    "When the last error happened; null while the mailbox works."
    lastErrorAt: DateTime
    connectedAt: DateTime
    "The mailbox new email goes from unless another one is chosen."
    isDefault: Boolean!
  }

  "Which providers a person can connect a mailbox through (the platform's OAuth apps are set up)."
  type MyMailboxProviders {
    gmail: Boolean!
    microsoft: Boolean!
  }

  input SendMyEmailInput {
    "One of the caller's own mailboxes (myMailboxes); their default one when omitted."
    fromMailboxId: ID
    to: [String!]!
    cc: [String!]
    bcc: [String!]
    subject: String!
    "Rich HTML from the editor; sanitized on the server."
    body: String!
    replyTo: String
  }

  "What went out: never the body."
  type MyEmailSent {
    from: String!
    subject: String!
    recipientCount: Int!
  }

  extend type Query {
    "The caller's own mailboxes, the default one first."
    myMailboxes: [MyMailbox!]!
    myMailboxProviders: MyMailboxProviders!
  }

  extend type Mutation {
    "The provider's consent page to connect one of the caller's own mailboxes (or renew one); comes back to returnTo."
    startMyMailboxConnect(
      provider: CrmEmailProvider!
      returnTo: String!
      loginHint: String
    ): String!
    "Checks one of the caller's mailboxes works now; the outcome is kept on it as lastError."
    testMyMailbox(id: ID!): MyMailbox!
    "Removes one of the caller's mailboxes and its token."
    disconnectMyMailbox(id: ID!): Boolean!
    "Makes one of the caller's mailboxes the one new email goes from."
    setDefaultMyMailbox(id: ID!): MyMailbox!
    "Sends an email from one of the caller's own mailboxes. Not kept on any CRM record."
    sendMyEmail(input: SendMyEmailInput!): MyEmailSent!
  }
`;

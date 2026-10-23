import gql from 'graphql-tag';

/**
 * The CRM's Microsoft (Outlook / Microsoft 365) mail: the Entra app on Tech, the mailboxes
 * connected from the CRM, and sending from them. Sending only: threads are not synced back.
 */
export const microsoftMailTypeDefs = gql`
  "The Microsoft Entra app the CRM's Microsoft mailboxes connect through. Secrets stay on the server."
  type MicrosoftMailConfig {
    id: ID!
    clientId: String!
    "The Entra tenant signed in against: common, organizations, consumers or a tenant id."
    tenant: String!
    hasClientSecret: Boolean!
    clientSecretHint: String
    enabled: Boolean!
    "How many Microsoft mailboxes are connected to the CRM."
    accountCount: Int!
    "Register this exact address as a Web redirect URI on the Entra app."
    redirectUri: String!
    updatedAt: DateTime
  }

  input MicrosoftMailConfigInput {
    clientId: String!
    "Blank keeps the stored secret."
    clientSecret: String!
    "Blank means common."
    tenant: String!
    enabled: Boolean!
  }

  "A Microsoft mailbox connected to the CRM. Its token never leaves the server."
  type MicrosoftMailAccount {
    id: ID!
    email: String!
    "Whether the CRM sends from it."
    enabled: Boolean!
    status: GmailAccountStatus!
    "Why the last call to Microsoft failed; empty when it worked."
    lastError: String!
    "When the last error happened; null while the mailbox works."
    lastErrorAt: DateTime
    connectedAt: DateTime
    connectedByName: String!
    lastUsedAt: DateTime
  }

  extend type Query {
    microsoftMailConfig: MicrosoftMailConfig!
    "The Microsoft mailboxes connected to the CRM, newest first."
    microsoftMailAccounts: [MicrosoftMailAccount!]!
    "Whether Tech has saved and turned on the Entra app the mailboxes connect through."
    microsoftMailClientReady: Boolean!
  }

  extend type Mutation {
    saveMicrosoftMailConfig(input: MicrosoftMailConfigInput!): MicrosoftMailConfig!
    "Reads every enabled mailbox's address with its stored connection."
    testMicrosoftMailConfig: String!
    "Microsoft's consent page to connect one more mailbox (or renew one); comes back to returnTo. loginHint is the address being reconnected."
    startMicrosoftMailConnect(returnTo: String!, loginHint: String): String!
    "Checks one mailbox works now with a fresh token and its address; the outcome is kept on it as lastError."
    testMicrosoftMailAccount(id: ID!): MicrosoftMailAccount!
    "Turns a mailbox on or off for the CRM."
    setMicrosoftMailAccountEnabled(id: ID!, enabled: Boolean!): MicrosoftMailAccount!
    "Removes the mailbox and its token; mail already sent stays on the records."
    disconnectMicrosoftMailAccount(id: ID!): Boolean!
  }
`;

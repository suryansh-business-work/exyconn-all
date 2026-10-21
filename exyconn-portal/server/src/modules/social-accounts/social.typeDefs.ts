import gql from 'graphql-tag';

/** Social accounts for Marketing, and the OAuth apps behind them (Tech). */
export const socialAccountsTypeDefs = gql`
  enum SocialApp {
    LINKEDIN
    META
    THREADS
    X
    YOUTUBE
  }

  "A person's own account, or an organization's page acting as itself (a LinkedIn company page)."
  enum SocialAccountKind {
    PERSON
    ORGANIZATION
  }

  enum SocialNetwork {
    LINKEDIN
    FACEBOOK
    INSTAGRAM
    THREADS
    X
    YOUTUBE
  }

  "One provider's OAuth app, shared by every company. The secret is write-only."
  type SocialAppConfig {
    "The app itself, as its id: there is one row per provider."
    id: ID!
    app: SocialApp!
    label: String!
    "Where the app is registered with the provider."
    consoleUrl: String!
    "The redirect URL to register with the provider, exactly as shown."
    callbackUrl: String!
    clientId: String!
    hasClientSecret: Boolean!
    clientSecretHint: String
    enabled: Boolean!
  }

  input SocialAppConfigInput {
    app: SocialApp!
    clientId: String!
    "Blank keeps the stored secret."
    clientSecret: String
    enabled: Boolean!
  }

  "The outcome of checking an app's client ID and secret with its provider."
  type SocialAppTest {
    ok: Boolean!
    message: String!
  }

  "Whether Marketing can connect this provider right now."
  type SocialAppStatus {
    app: SocialApp!
    label: String!
    "True once Tech has set the app up and turned it on."
    available: Boolean!
    "The networks one connection adds (Facebook and Instagram for Meta)."
    networks: [SocialNetwork!]!
    "LinkedIn refused the company-page scopes for this app, so it connects member profiles only."
    pagesRefused: Boolean!
  }

  "A connected account. Its tokens never leave the server."
  type SocialAccount {
    id: ID!
    network: SocialNetwork!
    app: SocialApp!
    name: String!
    handle: String!
    avatarUrl: String!
    kind: SocialAccountKind!
    "False while paused: left out of Compose and syncs, and its scheduled posts held."
    active: Boolean!
    "When the network stopped reaching it (a page its member no longer administers)."
    disconnectedAt: DateTime
    "A LinkedIn profile connected before company pages: reconnect to add them."
    needsReconnect: Boolean!
    "Null when the token does not expire."
    expiresAt: DateTime
    connectedBy: String!
    "When its posts and numbers were last read from the network."
    lastSyncedAt: DateTime
    "Why the last read failed, in the network's words; empty when it worked."
    syncError: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    "Every provider's app, set up or not. Platform Tech staff."
    socialAppConfigs: [SocialAppConfig!]!
    "Which providers Marketing can connect. MARKETING."
    socialAppStatuses: [SocialAppStatus!]!
    "The company's connected accounts. MARKETING."
    socialAccounts: [SocialAccount!]!
  }

  extend type Mutation {
    saveSocialAppConfig(input: SocialAppConfigInput!): SocialAppConfig!
    "Checks the stored client ID and secret with the provider. Platform Tech staff."
    testSocialAppConfig(app: SocialApp!): SocialAppTest!
    "Starts connecting an account: returns the provider's consent page to open. MARKETING."
    startSocialConnect(app: SocialApp!): String!
    "Disconnects an account, and the LinkedIn pages connected through it. MARKETING."
    disconnectSocialAccount(id: ID!): Boolean!
    "Pauses an account (false) or turns it back on (true). MARKETING."
    setSocialAccountActive(id: ID!, active: Boolean!): SocialAccount!
  }
`;

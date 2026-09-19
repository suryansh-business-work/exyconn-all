import gql from 'graphql-tag';

/** Social accounts for Marketing, and the OAuth apps behind them (Tech). */
export const socialAccountsTypeDefs = gql`
  enum SocialApp {
    LINKEDIN
    META
    X
    YOUTUBE
  }

  enum SocialNetwork {
    LINKEDIN
    FACEBOOK
    INSTAGRAM
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

  "Whether Marketing can connect this provider right now."
  type SocialAppStatus {
    app: SocialApp!
    label: String!
    "True once Tech has set the app up and turned it on."
    available: Boolean!
    "The networks one connection adds (Facebook and Instagram for Meta)."
    networks: [SocialNetwork!]!
  }

  "A connected account. Its tokens never leave the server."
  type SocialAccount {
    id: ID!
    network: SocialNetwork!
    app: SocialApp!
    name: String!
    handle: String!
    avatarUrl: String!
    "Null when the token does not expire."
    expiresAt: DateTime
    connectedBy: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    "The four providers' apps, set up or not. Platform Tech staff."
    socialAppConfigs: [SocialAppConfig!]!
    "Which providers Marketing can connect. MARKETING."
    socialAppStatuses: [SocialAppStatus!]!
    "The company's connected accounts. MARKETING."
    socialAccounts: [SocialAccount!]!
  }

  extend type Mutation {
    saveSocialAppConfig(input: SocialAppConfigInput!): SocialAppConfig!
    "Starts connecting an account: returns the provider's consent page to open. MARKETING."
    startSocialConnect(app: SocialApp!): String!
    disconnectSocialAccount(id: ID!): Boolean!
  }
`;

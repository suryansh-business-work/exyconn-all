import gql from 'graphql-tag';

export const providerProfileTypeDefs = gql`
  "Whether reading a provider's bill needs a different key from the one the platform uses."
  enum ProviderBillingNeed {
    REQUIRED
    SAME_KEY
    PERMISSION
    NO_BILLING_API
  }

  enum ProviderLinkKind {
    DASHBOARD
    API_KEYS
    USAGE
    BILLING
    DOCS
    OTHER
  }

  enum ProviderSignInMethod {
    EMAIL_PASSWORD
    GOOGLE
    GITHUB
    MICROSOFT
    APPLE
    SSO
    OTHER
  }

  type ProviderBilling {
    need: ProviderBillingNeed!
    message: String!
  }

  type ProviderGuideStep {
    description: String!
  }

  type ProviderLinkEntry {
    id: ID!
    label: String!
    url: String!
    kind: ProviderLinkKind!
    "False for the built-in links, which cannot be edited."
    custom: Boolean!
  }

  "An account a provider's keys were created under. The password is never listed."
  type ProviderLogin {
    id: ID!
    label: String!
    username: String!
    signInMethod: ProviderSignInMethod!
    hasPassword: Boolean!
    passwordHint: String!
    notes: String!
  }

  "Environment Variables > a provider > Advanced."
  type TechProviderProfile {
    provider: String!
    label: String!
    billing: ProviderBilling!
    steps: [ProviderGuideStep!]!
    links: [ProviderLinkEntry!]!
    logins: [ProviderLogin!]!
  }

  input ProviderLoginInput {
    label: String!
    username: String!
    signInMethod: ProviderSignInMethod!
    "Blank on an edit keeps the stored password."
    password: String!
    notes: String!
  }

  input ProviderLinkInput {
    label: String!
    url: String!
    kind: ProviderLinkKind!
  }

  extend type Query {
    "Null for a section with no provider guide (Dashboard, AI pricing)."
    techProviderProfile(provider: String!): TechProviderProfile
    "One saved account password in full. Logged; needs the vault open."
    techProviderLoginPassword(provider: String!, id: ID!): String!
  }

  extend type Mutation {
    saveTechProviderLogin(
      provider: String!
      id: ID
      input: ProviderLoginInput!
    ): TechProviderProfile!
    deleteTechProviderLogin(provider: String!, id: ID!): TechProviderProfile!
    saveTechProviderLink(provider: String!, id: ID, input: ProviderLinkInput!): TechProviderProfile!
    deleteTechProviderLink(provider: String!, id: ID!): TechProviderProfile!
  }
`;

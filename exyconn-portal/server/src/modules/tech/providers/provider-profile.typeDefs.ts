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

  type ProviderBillingAdvice {
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
    billing: ProviderBillingAdvice!
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
    "Platform TECH: adds (no id) or edits a provider account login. The password is stored encrypted; blank on an edit keeps it. Audited."
    saveTechProviderLogin(
      "The provider key, as techProviderProfile takes it."
      provider: String!
      "The login to edit. Left out, a new one is added."
      id: ID
      input: ProviderLoginInput!
    ): TechProviderProfile!
    "Platform TECH: removes one saved provider account login and its password. Audited."
    deleteTechProviderLogin(
      "The provider key, as techProviderProfile takes it."
      provider: String!
      id: ID!
    ): TechProviderProfile!
    "Platform TECH: adds (no id) or edits a custom link on a provider's profile. Audited."
    saveTechProviderLink(
      "The provider key, as techProviderProfile takes it."
      provider: String!
      "The link to edit. Left out, a new one is added."
      id: ID
      input: ProviderLinkInput!
    ): TechProviderProfile!
    "Platform TECH: removes one custom link from a provider's profile. Audited."
    deleteTechProviderLink(
      "The provider key, as techProviderProfile takes it."
      provider: String!
      id: ID!
    ): TechProviderProfile!
  }
`;

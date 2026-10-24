import gql from 'graphql-tag';

/** Tech > Environment Variables: what each integration was used for, what it cost, in any currency. */
export const techUsageTypeDefs = gql`
  "An integration whose calls are counted on the Environment Variables dashboard."
  enum IntegrationProvider {
    OPENAI
    SMTP
    IMAGEKIT
    SLACK
    GITHUB
    PEXELS
    FIRECRAWL
    GOOGLE_MAPS
  }

  "One day of an integration's calls. costUsd is priced from the AI price table (OpenAI only)."
  type IntegrationUsageDay {
    day: String!
    calls: Int!
    failures: Int!
    inputTokens: Float!
    outputTokens: Float!
    costUsd: Float!
  }

  "One kind of call (an OpenAI model, a Slack method, an upload kind) over the window."
  type IntegrationUsageAction {
    action: String!
    calls: Int!
    failures: Int!
    inputTokens: Float!
    outputTokens: Float!
    costUsd: Float!
  }

  "An integration's usage over the window, the whole platform's."
  type IntegrationUsageSummary {
    provider: IntegrationProvider!
    calls: Int!
    failures: Int!
    inputTokens: Float!
    outputTokens: Float!
    costUsd: Float!
    "A point for every day of the window, oldest first."
    days: [IntegrationUsageDay!]!
    actions: [IntegrationUsageAction!]!
  }

  type FxRate {
    currency: String!
    "Units of the currency one US dollar buys."
    rate: Float!
  }

  "The newest daily exchange rates from US dollars, which every cost is recorded in."
  type FxRates {
    base: String!
    "The day the rates were published for; empty until the first refresh."
    date: String!
    rates: [FxRate!]!
  }

  "A provider whose real bill a billing key can read."
  enum BillingProvider {
    OPENAI
  }

  "An extra key that reads a provider's real bill (OpenAI's Admin key). Write-only, sealed at rest."
  type BillingKeyConfig {
    id: ID!
    provider: BillingProvider!
    label: String!
    hasKey: Boolean!
    keyHint: String
    isActive: Boolean!
    updatedAt: DateTime!
  }

  input BillingKeyConfigInput {
    provider: BillingProvider!
    label: String!
    "Required when adding. Leave empty when editing to keep the stored key."
    key: String!
    isActive: Boolean
  }

  type BilledDay {
    day: String!
    amountUsd: Float!
  }

  "What the provider itself billed, read with its active billing key."
  type ProviderBilling {
    provider: BillingProvider!
    totalUsd: Float!
    days: [BilledDay!]!
  }

  "One saved credential, in full, as the bulk reveal returns it."
  type TechSecretValue {
    secret: TechSecret!
    "The config the value belongs to (its id, or its key for keyed configs)."
    id: ID!
    value: String!
  }

  extend type Query {
    "Every integration's usage over the last days (1 to 366), today included. Platform staff (TECH)."
    integrationUsage(days: Int!): [IntegrationUsageSummary!]!
    "The newest exchange rates from US dollars."
    fxRates: FxRates!
    billingKeyConfigs: [BillingKeyConfig!]!
    "The provider's real bill over the last days (1 to 180); null with no active billing key."
    providerBilling(provider: BillingProvider!, days: Int!): ProviderBilling
  }

  extend type Mutation {
    createBillingKeyConfig(input: BillingKeyConfigInput!): BillingKeyConfig!
    updateBillingKeyConfig(id: ID!, input: BillingKeyConfigInput!): BillingKeyConfig!
    deleteBillingKeyConfig(id: ID!): Boolean!
    testBillingKeyConfig(id: ID!): String!
    """
    Every saved credential on Environment Variables, in full — what the page holds in memory so
    the eye button needs no further request. One audit entry per call.
    """
    revealAllTechSecrets: [TechSecretValue!]!
  }
`;

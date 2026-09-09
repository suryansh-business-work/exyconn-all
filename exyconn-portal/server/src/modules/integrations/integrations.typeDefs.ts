import gql from 'graphql-tag';

export const integrationsTypeDefs = gql`
  """
  A machine's credential. The key itself is stored only as a SHA-256, so it exists in clear
  exactly once — in the response that created it.
  """
  type ApiKey {
    id: ID!
    name: String!
    "The readable half, kept in clear so a key can be named in a list and in a log."
    prefix: String!
    "What this key may do. Never more than a role a person could hold."
    roles: [String!]!
    createdBy: String!
    lastUsedAt: DateTime
    revokedAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
  }

  "A newly minted key. \`key\` is returned once and can never be recovered."
  type IssuedApiKey {
    apiKey: ApiKey!
    key: String!
  }

  type Webhook {
    id: ID!
    name: String!
    url: String!
    events: [String!]!
    active: Boolean!
    createdBy: String!
    lastDeliveredAt: DateTime
    "Consecutive failures. Reset by a success."
    failureCount: Int!
    createdAt: DateTime!
  }

  "A newly created endpoint. The signing secret is returned once and never listed again."
  type CreatedWebhook {
    webhook: Webhook!
    secret: String!
  }

  "One attempt to deliver one event, and what the receiver said."
  type WebhookDelivery {
    id: ID!
    webhookId: String!
    event: String!
    status: String!
    attempts: Int!
    responseStatus: Int
    error: String!
    nextAttemptAt: DateTime!
    deliveredAt: DateTime
    createdAt: DateTime!
  }

  extend type Query {
    listApiKeys: [ApiKey!]!
    listWebhooks: [Webhook!]!
    listWebhookDeliveries(webhookId: ID!): [WebhookDelivery!]!
    "The events an endpoint may subscribe to. A fixed list, so a dead subscription is impossible."
    webhookEvents: [String!]!
  }

  extend type Mutation {
    createApiKey(name: String!, roles: [String!]!): IssuedApiKey!
    revokeApiKey(id: ID!): ApiKey!
    createWebhook(name: String!, url: String!, events: [String!]!): CreatedWebhook!
    setWebhookActive(id: ID!, active: Boolean!): Webhook!
    deleteWebhook(id: ID!): Boolean!
  }
`;

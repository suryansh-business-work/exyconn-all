import gql from 'graphql-tag';

/**
 * The developer portal (developers.exyconn.com): per-key usage, the webhook event catalogue,
 * the paged delivery log and an API reference built from the schema's own descriptions.
 */
export const developerTypeDefs = gql`
  "How many requests an API key made on one UTC day."
  type ApiKeyUsageDay {
    "The day, as YYYY-MM-DD."
    day: String!
    count: Int!
  }

  "One event a webhook may subscribe to: what it means and the fields its data carries."
  type WebhookEventInfo {
    event: String!
    "The module that sends it, e.g. Finance."
    module: String!
    description: String!
    "The keys of the event payload's data object."
    fields: [String!]!
  }

  "One delivery attempt in the webhook delivery log, with the endpoint's name."
  type WebhookDeliveryRow {
    id: ID!
    webhookId: String!
    webhookName: String!
    event: String!
    status: String!
    attempts: Int!
    responseStatus: Int
    error: String!
    "The exact JSON body that was signed and sent."
    payload: String!
    nextAttemptAt: DateTime!
    deliveredAt: DateTime
    createdAt: DateTime!
  }

  type WebhookDeliveryPage {
    rows: [WebhookDeliveryRow!]!
    totalCount: Int!
  }

  "One GraphQL operation in the API reference, described the way the MCP tools are."
  type ApiOperation {
    name: String!
    kind: McpToolKind!
    description: String!
    arguments: [McpToolArgument!]!
    "The GraphQL type the operation answers with."
    returnType: String!
    "A ready-to-run GraphQL document for the operation."
    example: String!
  }

  extend type Query {
    "ADMIN: requests an API key made per UTC day over the last days (1 to 90), oldest first, zero days included."
    apiKeyUsage(
      "The API key's id."
      id: ID!
      "How many days back, 1 to 90."
      days: Int!
    ): [ApiKeyUsageDay!]!
    "ADMIN: every webhook event, what it means and the fields its payload carries."
    webhookEventCatalogue: [WebhookEventInfo!]!
    "ADMIN: lists webhook delivery attempts across every endpoint, one page at a time, newest first."
    listWebhookDeliveriesPaged(input: TableQueryInput!): WebhookDeliveryPage!
    "ADMIN: summary numbers for the webhook delivery log: total and counts by status and event."
    listWebhookDeliveriesStats: TableStats!
    "ADMIN: the GraphQL operations of one module, with descriptions, arguments and an example document."
    apiReference(
      "The module, as its MCP server is named. ALL is not accepted."
      endpoint: McpEndpoint!
    ): [ApiOperation!]!
  }
`;

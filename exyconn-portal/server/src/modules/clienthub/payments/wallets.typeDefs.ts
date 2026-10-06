import gql from 'graphql-tag';

/** Exyconn's PayPal and Payoneer accounts (Tech > Environment Variables), beside Stripe and Razorpay. */
export const walletGatewayTypeDefs = gql`
  "Whether a gateway account talks to the gateway's test environment or takes real money."
  enum GatewayMode {
    SANDBOX
    LIVE
  }

  "Exyconn's PayPal account (Tech > Environment Variables). The client secret is write-only."
  type PaypalConfig {
    id: ID!
    label: String!
    clientId: String!
    hasClientSecret: Boolean!
    clientSecretHint: String
    "The webhook registered in the PayPal app; PayPal verifies each delivery against it."
    webhookId: String!
    mode: GatewayMode!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input PaypalConfigInput {
    label: String!
    clientId: String!
    "Left blank on an edit, the stored secret is kept."
    clientSecret: String
    webhookId: String!
    mode: GatewayMode!
    isActive: Boolean!
  }

  "Exyconn's Payoneer Checkout account (Tech > Environment Variables). The API token is write-only."
  type PayoneerConfig {
    id: ID!
    label: String!
    merchantCode: String!
    hasApiToken: Boolean!
    apiTokenHint: String
    "The merchant division payments are taken under; empty for an account without divisions."
    division: String!
    mode: GatewayMode!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input PayoneerConfigInput {
    label: String!
    merchantCode: String!
    "Left blank on an edit, the stored token is kept."
    apiToken: String
    division: String
    mode: GatewayMode!
    isActive: Boolean!
  }

  extend type Query {
    listPaypalConfigs: [PaypalConfig!]!
    listPayoneerConfigs: [PayoneerConfig!]!
  }

  extend type Mutation {
    createPaypalConfig(input: PaypalConfigInput!): PaypalConfig!
    updatePaypalConfig(id: ID!, input: PaypalConfigInput!): PaypalConfig!
    deletePaypalConfig(id: ID!): Boolean!
    testPaypalConnection(id: ID!): Boolean!
    createPayoneerConfig(input: PayoneerConfigInput!): PayoneerConfig!
    updatePayoneerConfig(id: ID!, input: PayoneerConfigInput!): PayoneerConfig!
    deletePayoneerConfig(id: ID!): Boolean!
    testPayoneerConnection(id: ID!): Boolean!
  }
`;

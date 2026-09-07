import gql from 'graphql-tag';

export const clientsTypeDefs = gql`
  enum ClientStatus {
    ACTIVE
    INACTIVE
    PROSPECT
  }

  type Client {
    id: ID!
    name: String!
    email: String!
    phone: String!
    company: String!
    status: ClientStatus!
    "The client's GST registration, printed on invoices to them."
    gstin: String!
    "Two-digit GST state code — the default place of supply on their invoices."
    stateCode: String!
    billingAddress: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ClientInput {
    name: String!
    email: String!
    phone: String!
    company: String!
    status: ClientStatus!
    gstin: String
    stateCode: String
    billingAddress: String
  }

  type ClientPage {
    rows: [Client!]!
    totalCount: Int!
  }

  extend type Query {
    listClients: [Client!]!
    listClientsPaged(input: TableQueryInput!): ClientPage!
    listClientsStats: TableStats!
    getClient(id: ID!): Client!
  }

  extend type Mutation {
    createClient(input: ClientInput!): Client!
    updateClient(id: ID!, input: ClientInput!): Client!
    deleteClient(id: ID!): Boolean!
  }
`;

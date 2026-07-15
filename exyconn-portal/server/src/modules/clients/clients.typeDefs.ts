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
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ClientInput {
    name: String!
    email: String!
    phone: String!
    company: String!
    status: ClientStatus!
  }

  type ClientPage {
    rows: [Client!]!
    totalCount: Int!
  }

  extend type Query {
    listClients: [Client!]!
    listClientsPaged(input: TableQueryInput!): ClientPage!
    getClient(id: ID!): Client!
  }

  extend type Mutation {
    createClient(input: ClientInput!): Client!
    updateClient(id: ID!, input: ClientInput!): Client!
    deleteClient(id: ID!): Boolean!
  }
`;

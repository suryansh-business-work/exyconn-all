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

  extend type Query {
    listClients: [Client!]!
    getClient(id: ID!): Client!
  }

  extend type Mutation {
    createClient(input: ClientInput!): Client!
    updateClient(id: ID!, input: ClientInput!): Client!
    deleteClient(id: ID!): Boolean!
  }
`;

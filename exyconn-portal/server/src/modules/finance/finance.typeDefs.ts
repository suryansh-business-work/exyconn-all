import gql from 'graphql-tag';

export const financeTypeDefs = gql`
  enum InvoiceStatus {
    DRAFT
    SENT
    PAID
    OVERDUE
  }

  type Invoice {
    id: ID!
    number: String!
    clientId: String!
    amount: Float!
    currency: String!
    status: InvoiceStatus!
    issuedDate: DateTime!
    dueDate: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input InvoiceInput {
    number: String!
    clientId: String!
    amount: Float!
    currency: String!
    status: InvoiceStatus!
    issuedDate: DateTime!
    dueDate: DateTime!
  }

  extend type Query {
    listInvoices: [Invoice!]!
    getInvoice(id: ID!): Invoice!
  }

  extend type Mutation {
    createInvoice(input: InvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: InvoiceInput!): Invoice!
    deleteInvoice(id: ID!): Boolean!
  }
`;

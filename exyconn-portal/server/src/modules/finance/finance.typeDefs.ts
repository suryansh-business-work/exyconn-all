import gql from 'graphql-tag';

export const financeTypeDefs = gql`
  enum InvoiceStatus {
    DRAFT
    SENT
    PARTIALLY_PAID
    PAID
    OVERDUE
  }

  "One billed line. amount = quantity × rate × (1 + taxPercent / 100), computed on read."
  type InvoiceLine {
    description: String!
    quantity: Float!
    rate: Float!
    taxPercent: Float!
    amount: Float!
  }

  input InvoiceLineInput {
    description: String!
    quantity: Float!
    rate: Float!
    taxPercent: Float!
  }

  type Invoice {
    id: ID!
    number: String!
    clientId: String!
    "The client's name at the time the invoice was written."
    clientName: String!
    lines: [InvoiceLine!]!
    "The sum of the lines when there are any; otherwise the figure typed on the invoice."
    amount: Float!
    currency: String!
    status: InvoiceStatus!
    issuedDate: DateTime!
    dueDate: DateTime!
    "When the invoice was last emailed to the client."
    sentAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input InvoiceInput {
    number: String!
    clientId: String!
    lines: [InvoiceLineInput!]
    "Required when there are no lines; ignored (recomputed) when there are."
    amount: Float
    currency: String!
    status: InvoiceStatus!
    issuedDate: DateTime!
    dueDate: DateTime!
  }

  type InvoicePage {
    rows: [Invoice!]!
    totalCount: Int!
  }

  extend type Query {
    listInvoices: [Invoice!]!
    listInvoicesPaged(input: TableQueryInput!): InvoicePage!
    listInvoicesStats: TableStats!
    getInvoice(id: ID!): Invoice!
    "The invoice as a PDF, base64 encoded."
    invoicePdf(id: ID!): String!
  }

  extend type Mutation {
    createInvoice(input: InvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: InvoiceInput!): Invoice!
    deleteInvoice(id: ID!): Boolean!
    "Emails the invoice PDF to the client, moves a draft to SENT and stamps sentAt."
    sendInvoice(id: ID!, email: String!, message: String): Invoice!
  }
`;

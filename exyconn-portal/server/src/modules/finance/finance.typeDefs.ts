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
    "HSN (goods) or SAC (services) code, printed per line on a GST invoice."
    hsnSac: String!
    amount: Float!
  }

  input InvoiceLineInput {
    description: String!
    quantity: Float!
    rate: Float!
    taxPercent: Float!
    hsnSac: String
  }

  "One state or union territory as the GST portal numbers it."
  type GstState {
    code: String!
    name: String!
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
    "The project whose time log raised this invoice; null when it was written by hand."
    projectId: String
    periodFrom: DateTime
    periodTo: DateTime
    "The won deal this invoice bills; empty when it was written by hand."
    dealId: String!
    "Two-digit GST state code of the client's place of supply."
    placeOfSupplyStateCode: String!
    "Our GST state code when the invoice was written."
    supplierStateCode: String!
    "The lines before tax."
    subtotal: Float!
    "The tax the lines add, whichever heads it falls under."
    taxTotal: Float!
    "Half the tax when the place of supply is our own state; otherwise 0."
    cgst: Float!
    "The other half of an intra-state tax; otherwise 0."
    sgst: Float!
    "The whole tax when the place of supply is another state; otherwise 0."
    igst: Float!
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
    placeOfSupplyStateCode: String
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
    "India's GST state codes, for a place-of-supply or state picker."
    gstStates: [GstState!]!
  }

  extend type Mutation {
    createInvoice(input: InvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: InvoiceInput!): Invoice!
    deleteInvoice(id: ID!): Boolean!
    "Emails the invoice PDF to the client, moves a draft to SENT and stamps sentAt."
    sendInvoice(id: ID!, email: String!, message: String): Invoice!
    "A draft invoice billing a won deal's value to its client. Refused if one already exists."
    createInvoiceFromDeal(dealId: ID!): Invoice!
    """
    A DRAFT invoice for a project's billable time: one line per employee at their HR billing
    rate. FINANCE or PROJECTS. Refused when the project has no client, the period has no
    hours, or an employee has no rate.
    """
    createInvoiceFromTimeLog(projectId: ID!, from: DateTime!, to: DateTime!): Invoice!
  }
`;

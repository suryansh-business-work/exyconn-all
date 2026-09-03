import gql from 'graphql-tag';

/**
 * Payments and receivables. Kept apart from `finance.typeDefs.ts` so that stays the
 * invoice schema it was, exactly as the products module keeps its inventory schema apart.
 */
export const financeBillingTypeDefs = gql`
  enum PaymentMethod {
    BANK_TRANSFER
    CARD
    UPI
    CHEQUE
    CASH
    OTHER
  }

  "One receipt against one invoice. Negative for a refund."
  type Payment {
    id: ID!
    invoiceId: ID!
    invoiceNumber: String!
    clientId: String!
    amount: Float!
    currency: String!
    method: PaymentMethod!
    reference: String!
    notes: String!
    receivedAt: DateTime!
    recordedBy: String!
    createdAt: DateTime!
  }

  input PaymentInput {
    invoiceId: ID!
    amount: Float!
    method: PaymentMethod!
    reference: String
    notes: String
    receivedAt: DateTime
  }

  type PaymentPage {
    rows: [Payment!]!
    totalCount: Int!
  }

  "One age band of unpaid invoice balances, counted from the due date."
  type ReceivablesBucket {
    "CURRENT, D1_30, D31_60 or D60_PLUS."
    band: String!
    label: String!
    invoices: Int!
    amount: Float!
  }

  "What is owed, and how late it is."
  type Receivables {
    "Everything unpaid, whether or not it is late."
    outstanding: Float!
    "The part of outstanding that is past its due date."
    overdue: Float!
    invoices: Int!
    buckets: [ReceivablesBucket!]!
  }

  extend type Invoice {
    "Sum of the payments recorded against this invoice."
    amountPaid: Float!
    "amount - amountPaid. What is still owed."
    balanceDue: Float!
  }

  extend type Query {
    listPayments: [Payment!]!
    listPaymentsPaged(input: TableQueryInput!): PaymentPage!
    listPaymentsStats: TableStats!
    "Payments against one invoice, newest first."
    invoicePayments(invoiceId: ID!): [Payment!]!
    receivables: Receivables!
  }

  extend type Mutation {
    "Records a receipt and moves the invoice's paid figure and status with it, in one step."
    recordPayment(input: PaymentInput!): Payment!
  }
`;

import gql from 'graphql-tag';

export const financeRecurringTypeDefs = gql`
  "How often a retainer bills. A small fixed list, deliberately — not a cron expression."
  enum RecurrenceFrequency {
    WEEKLY
    MONTHLY
    QUARTERLY
    YEARLY
  }

  """
  A standing instruction to raise the same invoice every period.

  It is not an invoice and never becomes one — it spawns them, each a DRAFT for somebody to
  check and send. Keeping the schedule separate from what it produced is what lets a
  retainer's rate change next month without rewriting the invoices already paid under the old.
  """
  type RecurringInvoice {
    id: ID!
    "What this retainer is called on the schedule screen. Never printed on the invoice."
    name: String!
    clientId: String!
    "The client's name at the time the schedule was written."
    clientName: String!
    lines: [InvoiceLine!]!
    "What each generated invoice will total, from the lines."
    amount: Float!
    currency: String!
    placeOfSupplyStateCode: String!
    frequency: RecurrenceFrequency!
    startDate: DateTime!
    "When the next invoice is due to be raised. Owned by the schedule; not editable by hand."
    nextRunAt: DateTime!
    "Stops after this date. Null runs until somebody pauses it."
    endDate: DateTime
    "Days between an invoice's issue date and its due date."
    dueDays: Int!
    "A paused schedule keeps its place, so resuming bills the period it was paused in."
    active: Boolean!
    lastGeneratedAt: DateTime
    "How many invoices this schedule has raised — the answer to 'is this thing working'."
    generatedCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input RecurringInvoiceInput {
    name: String!
    clientId: String!
    lines: [InvoiceLineInput!]!
    currency: String!
    placeOfSupplyStateCode: String
    frequency: RecurrenceFrequency!
    startDate: DateTime!
    endDate: DateTime
    dueDays: Int!
    active: Boolean
  }

  type RecurringInvoicePage {
    rows: [RecurringInvoice!]!
    totalCount: Int!
  }

  extend type Query {
    listRecurringInvoices: [RecurringInvoice!]!
    listRecurringInvoicesPaged(input: TableQueryInput!): RecurringInvoicePage!
    getRecurringInvoice(id: ID!): RecurringInvoice
  }

  extend type Mutation {
    createRecurringInvoice(input: RecurringInvoiceInput!): RecurringInvoice!
    updateRecurringInvoice(id: ID!, input: RecurringInvoiceInput!): RecurringInvoice!
    deleteRecurringInvoice(id: ID!): Boolean!
    """
    Raises this schedule's current period now and moves it on — the same order the unattended
    loop uses, so pressing the button cannot bill a client twice either.
    """
    runRecurringInvoiceNow(id: ID!): RecurringInvoice!
  }
`;

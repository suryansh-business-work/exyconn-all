import gql from 'graphql-tag';

/**
 * Company finance: what the business spends, and what the whole picture adds up to.
 *
 * Kept apart from finance.typeDefs.ts (invoices) and finance.billing.typeDefs.ts (customer
 * payments) so each stays the schema it was.
 */
export const financeCompanyTypeDefs = gql`
  enum ExpenseCategory {
    RENT
    SALARIES
    SOFTWARE
    HARDWARE
    SERVICES
    MARKETING
    TRAVEL
    UTILITIES
    TAXES
    OTHER
  }

  enum ExpenseState {
    UNPAID
    PAID
  }

  "A cost the company incurred — a vendor bill, rent, a subscription."
  type CompanyExpense {
    id: ID!
    vendor: String!
    category: ExpenseCategory!
    description: String!
    amount: Float!
    currency: String!
    "When the cost was incurred. Profit is measured on this date."
    incurredOn: DateTime!
    dueDate: DateTime!
    status: ExpenseState!
    "When the money actually left. Cash flow is measured on this date. Null until paid."
    paidOn: DateTime
    reference: String!
    recordedBy: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CompanyExpenseInput {
    vendor: String!
    category: ExpenseCategory!
    description: String
    amount: Float!
    currency: String!
    incurredOn: DateTime!
    dueDate: DateTime!
    reference: String
  }

  type CompanyExpensePage {
    rows: [CompanyExpense!]!
    totalCount: Int!
  }

  "One slice of spend, for the category breakdown."
  type FinanceBucket {
    key: String!
    label: String!
    amount: Float!
  }

  "One month of the trend. Revenue and cost are accrual figures, not cash."
  type FinanceMonth {
    "YYYY-MM."
    month: String!
    label: String!
    revenue: Float!
    cost: Float!
    profit: Float!
  }

  """
  The company's finances over a period.

  Two different questions live here and they are answered separately on purpose. The
  ACCRUAL figures (invoiced, expenses, payroll, reimbursements, profit) say what the period
  earned and what it cost, whenever the money happens to move. The CASH figures (collected,
  paidOut, netCash) say what actually moved. A dashboard that shows one number called
  "revenue" without saying which of the two it is invites an argument nobody can settle.
  """
  type CompanyFinance {
    from: DateTime!
    to: DateTime!

    "Accrual: invoices issued in the period."
    invoiced: Float!
    "Accrual: company bills incurred in the period."
    expenses: Float!
    "Accrual: payslips issued in the period."
    payroll: Float!
    "Accrual: employee expense claims incurred in the period, once approved."
    reimbursements: Float!
    "expenses + payroll + reimbursements."
    totalCost: Float!
    "invoiced - totalCost."
    profit: Float!

    "Cash: customer payments received in the period."
    collected: Float!
    "Cash: bills settled in the period."
    paidOut: Float!
    "collected - paidOut."
    netCash: Float!

    "Owed to the company right now, regardless of the period."
    outstandingReceivable: Float!
    "Owed by the company right now, regardless of the period."
    outstandingPayable: Float!
    "The part of outstandingPayable already past its due date."
    overduePayable: Float!

    byCategory: [FinanceBucket!]!
    months: [FinanceMonth!]!
  }

  extend type Query {
    listCompanyExpenses: [CompanyExpense!]!
    listCompanyExpensesPaged(input: TableQueryInput!): CompanyExpensePage!
    listCompanyExpensesStats: TableStats!
    getCompanyExpense(id: ID!): CompanyExpense!
    """
    The company's finances between two dates. Both bounds are inclusive of the days they
    fall on, as the caller sends them.
    """
    companyFinance(from: DateTime!, to: DateTime!): CompanyFinance!
  }

  extend type Mutation {
    createCompanyExpense(input: CompanyExpenseInput!): CompanyExpense!
    updateCompanyExpense(id: ID!, input: CompanyExpenseInput!): CompanyExpense!
    deleteCompanyExpense(id: ID!): Boolean!
    "Settles a bill: records when the money left and moves it to PAID."
    markExpensePaid(id: ID!, paidOn: DateTime): CompanyExpense!
  }
`;

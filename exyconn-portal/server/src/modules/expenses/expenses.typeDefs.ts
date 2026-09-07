import gql from 'graphql-tag';

export const expensesTypeDefs = gql`
  enum ExpenseStatus {
    SUBMITTED
    APPROVED
    REJECTED
    PAID
  }

  type ExpenseClaim {
    id: ID!
    employeeId: String!
    category: String!
    description: String!
    amount: Float!
    currency: String!
    incurredOn: DateTime!
    receiptUrl: String
    status: ExpenseStatus!
    approvedAmount: Float
    "When the reimbursement was paid out. Cash flow is measured on this date. Null until paid."
    paidOn: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ExpenseClaimInput {
    employeeId: String!
    category: String!
    description: String!
    amount: Float!
    currency: String!
    incurredOn: DateTime!
    receiptUrl: String
    status: ExpenseStatus!
    approvedAmount: Float
  }

  input MyExpenseClaimInput {
    category: String!
    description: String!
    amount: Float!
    currency: String!
    incurredOn: DateTime!
    receiptUrl: String
  }

  type ExpenseClaimPage {
    rows: [ExpenseClaim!]!
    totalCount: Int!
  }

  extend type Query {
    listExpenseClaims: [ExpenseClaim!]!
    listExpenseClaimsPaged(input: TableQueryInput!): ExpenseClaimPage!
    listExpenseClaimsStats: TableStats!
    getExpenseClaim(id: ID!): ExpenseClaim!
    myExpenseClaims: [ExpenseClaim!]!
  }

  extend type Mutation {
    createExpenseClaim(input: ExpenseClaimInput!): ExpenseClaim!
    updateExpenseClaim(id: ID!, input: ExpenseClaimInput!): ExpenseClaim!
    deleteExpenseClaim(id: ID!): Boolean!
    """
    Filed by the employee for themselves: id from the token, always SUBMITTED,
    and the approved amount stays finance's to set.
    """
    createMyExpenseClaim(input: MyExpenseClaimInput!): ExpenseClaim!
    """
    Finance's decision on a claim. APPROVED takes an approved amount (defaults to the claim);
    PAID stamps paidOn, the date the reimbursement reaches the cash figures.
    """
    setExpenseClaimStatus(id: ID!, status: ExpenseStatus!, approvedAmount: Float): ExpenseClaim!
  }
`;

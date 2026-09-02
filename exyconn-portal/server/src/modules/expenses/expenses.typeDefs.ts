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
  }
`;

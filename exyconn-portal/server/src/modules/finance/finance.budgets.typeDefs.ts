import gql from 'graphql-tag';

/**
 * Cost centres, monthly budgets, and the variance between a budget and what was spent.
 *
 * Kept apart from finance.company.typeDefs.ts (bills and the whole-company picture) for the
 * same reason that file is kept apart from invoices: each stays the schema it was.
 */
export const financeBudgetTypeDefs = gql`
  "A bucket the company budgets and reports spend against — a department, a team, a site."
  type CostCenter {
    id: ID!
    code: String!
    name: String!
    description: String!
    "User id of whoever answers for this centre's spend. Empty while nobody owns it."
    ownerId: String!
    "A retired centre stays readable, so last year's report does not change."
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CostCenterInput {
    code: String!
    name: String!
    description: String
    ownerId: String
    isActive: Boolean!
  }

  type CostCenterPage {
    rows: [CostCenter!]!
    totalCount: Int!
  }

  "What one cost centre may spend in one month. A quarter is three of these."
  type Budget {
    id: ID!
    costCenterId: String!
    "YYYY-MM, bucketed exactly as the actuals are."
    month: String!
    amount: Float!
    currency: String!
    note: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input BudgetInput {
    costCenterId: String!
    month: String!
    amount: Float!
    currency: String!
    note: String
  }

  type BudgetPage {
    rows: [Budget!]!
    totalCount: Int!
  }

  """
  One centre's plan against its spend.

  Actual is company bills booked to the centre — not payroll and not reimbursed employee
  claims, neither of which carries a cost centre. Untagged spend appears as its own row
  rather than being dropped, so the actuals still add up to what the company spent.
  """
  type BudgetVariance {
    "Empty for the unallocated row, which is not a cost centre."
    costCenterId: String!
    code: String!
    name: String!
    budgeted: Float!
    actual: Float!
    "budgeted - actual. Positive is money left; negative is an overspend."
    variance: Float!
    "Actual as a percentage of budget. Null where there is no budget to be a percentage of."
    utilisation: Float
  }

  extend type Query {
    listCostCenters: [CostCenter!]!
    listCostCentersPaged(input: TableQueryInput!): CostCenterPage!
    listCostCentersStats: TableStats!
    getCostCenter(id: ID!): CostCenter!

    listBudgets: [Budget!]!
    listBudgetsPaged(input: TableQueryInput!): BudgetPage!
    listBudgetsStats: TableStats!
    getBudget(id: ID!): Budget!

    """
    Budget against actual per cost centre between two dates, both bounds inclusive of the
    days they fall on. Every month the window touches counts in full.
    """
    budgetVsActual(from: DateTime!, to: DateTime!): [BudgetVariance!]!
  }

  extend type Mutation {
    createCostCenter(input: CostCenterInput!): CostCenter!
    updateCostCenter(id: ID!, input: CostCenterInput!): CostCenter!
    deleteCostCenter(id: ID!): Boolean!

    createBudget(input: BudgetInput!): Budget!
    updateBudget(id: ID!, input: BudgetInput!): Budget!
    deleteBudget(id: ID!): Boolean!
  }
`;

import gql from 'graphql-tag';

export const goalsTypeDefs = gql`
  enum GoalStatus {
    DRAFT
    ACTIVE
    COMPLETED
    CANCELLED
  }

  type Goal {
    id: ID!
    employeeId: String!
    title: String!
    description: String!
    kpi: String!
    weightage: Int!
    startDate: DateTime!
    endDate: DateTime!
    progress: Int!
    status: GoalStatus!
    managerComment: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input GoalInput {
    employeeId: String!
    title: String!
    description: String!
    kpi: String!
    weightage: Int!
    startDate: DateTime!
    endDate: DateTime!
    progress: Int!
    status: GoalStatus!
    managerComment: String
  }

  type GoalPage {
    rows: [Goal!]!
    totalCount: Int!
  }

  extend type Query {
    listGoals: [Goal!]!
    listGoalsPaged(input: TableQueryInput!): GoalPage!
    listGoalsStats: TableStats!
    getGoal(id: ID!): Goal!
    myGoals: [Goal!]!
  }

  extend type Mutation {
    createGoal(input: GoalInput!): Goal!
    updateGoal(id: ID!, input: GoalInput!): Goal!
    deleteGoal(id: ID!): Boolean!
    """
    Employee self-update. Only progress moves; weightage, dates and the manager's
    comment stay HR/manager-owned.
    """
    updateMyGoalProgress(id: ID!, progress: Int!): Goal!
  }
`;

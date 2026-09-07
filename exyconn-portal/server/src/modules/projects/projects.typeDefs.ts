import gql from 'graphql-tag';

export const projectsTypeDefs = gql`
  enum ProjectStatus {
    PLANNING
    ACTIVE
    ON_HOLD
    COMPLETED
  }

  type Project {
    id: ID!
    name: String!
    "The prefix every ticket key carries, e.g. EXY in EXY-14. Derived from the name."
    key: String!
    description: String
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
    clientId: String
    "The client's name at the time it was picked, so the grid never joins to read it."
    clientName: String!
    "Agreed budget in money. Null when none was set."
    budgetAmount: Float
    "Agreed budget in hours. Null when none was set."
    budgetHours: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ProjectInput {
    name: String!
    description: String
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
    clientId: String
    budgetAmount: Float
    budgetHours: Float
  }

  type ProjectPage {
    rows: [Project!]!
    totalCount: Int!
  }

  extend type Query {
    listProjects: [Project!]!
    listProjectsPaged(input: TableQueryInput!): ProjectPage!
    listProjectsStats: TableStats!
    getProject(id: ID!): Project!
  }

  extend type Mutation {
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
  }
`;

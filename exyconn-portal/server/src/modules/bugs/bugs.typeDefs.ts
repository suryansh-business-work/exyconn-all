import gql from 'graphql-tag';

export const bugsTypeDefs = gql`
  enum BugSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }
  enum BugStatus {
    OPEN
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  type Bug {
    id: ID!
    title: String!
    description: String!
    severity: BugSeverity!
    status: BugStatus!
    assignee: String!
    dueDate: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input BugInput {
    title: String!
    description: String!
    severity: BugSeverity!
    status: BugStatus!
    assignee: String!
    dueDate: DateTime!
  }

  extend type Query {
    listBugs: [Bug!]!
    getBug(id: ID!): Bug!
  }

  extend type Mutation {
    createBug(input: BugInput!): Bug!
    updateBug(id: ID!, input: BugInput!): Bug!
    deleteBug(id: ID!): Boolean!
  }
`;

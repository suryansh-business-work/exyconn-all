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
    "The project the bug was found in. Null for bugs filed before bugs had a project."
    projectId: String
    projectName: String!
    "Empty for bugs filed before the assignee was a user; assigneeName still shows the name."
    assigneeId: String!
    assigneeName: String!
    "The board ticket this bug became, once promoted."
    taskId: String
    taskKey: String!
    dueDate: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input BugInput {
    title: String!
    description: String!
    severity: BugSeverity!
    status: BugStatus!
    projectId: String
    assigneeId: String!
    dueDate: DateTime!
  }

  type BugPage {
    rows: [Bug!]!
    totalCount: Int!
  }

  extend type Query {
    listBugs: [Bug!]!
    listBugsPaged(input: TableQueryInput!): BugPage!
    listBugsStats: TableStats!
    getBug(id: ID!): Bug!
  }

  extend type Mutation {
    createBug(input: BugInput!): Bug!
    updateBug(id: ID!, input: BugInput!): Bug!
    deleteBug(id: ID!): Boolean!
    """
    Makes the bug a BUG ticket in the first column of its project's board and records the
    ticket on the bug. Refused when the bug has no project, or was already promoted.
    """
    promoteBugToTask(id: ID!): Task!
  }
`;

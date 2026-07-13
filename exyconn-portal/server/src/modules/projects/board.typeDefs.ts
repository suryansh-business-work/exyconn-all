import gql from 'graphql-tag';

export const boardTypeDefs = gql`
  type BoardColumn {
    id: ID!
    name: String!
    order: Int!
  }

  type Task {
    id: ID!
    columnId: ID!
    title: String!
    description: String
    order: Int!
  }

  type ProjectBoard {
    columns: [BoardColumn!]!
    tasks: [Task!]!
  }

  extend type Query {
    projectBoard(projectId: ID!): ProjectBoard!
  }

  extend type Mutation {
    createColumn(projectId: ID!, name: String!): BoardColumn!
    renameColumn(id: ID!, name: String!): BoardColumn!
    deleteColumn(id: ID!): Boolean!
    reorderColumns(projectId: ID!, columnIds: [ID!]!): Boolean!

    createTask(projectId: ID!, columnId: ID!, title: String!, description: String): Task!
    updateTask(id: ID!, title: String, description: String): Task!
    deleteTask(id: ID!): Boolean!
    moveTask(id: ID!, toColumnId: ID!, toIndex: Int!): Boolean!
  }
`;

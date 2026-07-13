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
    description: String
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ProjectInput {
    name: String!
    description: String
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
  }

  extend type Query {
    listProjects: [Project!]!
    getProject(id: ID!): Project!
  }

  extend type Mutation {
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
  }
`;

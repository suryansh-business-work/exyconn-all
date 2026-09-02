import gql from 'graphql-tag';

export const trainingTypeDefs = gql`
  enum TrainingStatus {
    ASSIGNED
    IN_PROGRESS
    COMPLETED
  }

  type Training {
    id: ID!
    employeeId: String!
    title: String!
    provider: String!
    category: String!
    assignedOn: DateTime!
    dueOn: DateTime
    completedOn: DateTime
    status: TrainingStatus!
    certificateUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input TrainingInput {
    employeeId: String!
    title: String!
    provider: String!
    category: String!
    assignedOn: DateTime!
    dueOn: DateTime
    completedOn: DateTime
    status: TrainingStatus!
    certificateUrl: String
  }

  type TrainingPage {
    rows: [Training!]!
    totalCount: Int!
  }

  extend type Query {
    listTrainings: [Training!]!
    listTrainingsPaged(input: TableQueryInput!): TrainingPage!
    listTrainingsStats: TableStats!
    getTraining(id: ID!): Training!
    myTrainings: [Training!]!
  }

  extend type Mutation {
    createTraining(input: TrainingInput!): Training!
    updateTraining(id: ID!, input: TrainingInput!): Training!
    deleteTraining(id: ID!): Boolean!
    """
    The employee marking their own progress. Completing it stamps completedOn.
    """
    updateMyTrainingStatus(id: ID!, status: TrainingStatus!): Training!
  }
`;

import gql from 'graphql-tag';

export const exitTypeDefs = gql`
  enum ExitStage {
    RESIGNED
    APPROVED
    NOTICE_PERIOD
    CLEARANCE
    FULL_AND_FINAL
    EXITED
    WITHDRAWN
  }

  type ExitRecord {
    id: ID!
    employeeId: String!
    resignationDate: DateTime!
    lastWorkingDate: DateTime
    noticePeriodDays: Int!
    reason: String!
    stage: ExitStage!
    assetsReturned: Boolean!
    knowledgeTransferDone: Boolean!
    exitInterviewNotes: String!
    finalSettlementAmount: Float
    documentsIssued: Boolean!
    "Days left until the last working day; null once it has passed or is unset."
    daysToLastWorkingDay: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ExitRecordInput {
    employeeId: String!
    resignationDate: DateTime!
    lastWorkingDate: DateTime
    noticePeriodDays: Int!
    reason: String!
    stage: ExitStage!
    assetsReturned: Boolean!
    knowledgeTransferDone: Boolean!
    exitInterviewNotes: String!
    finalSettlementAmount: Float
    documentsIssued: Boolean!
  }

  type ExitRecordPage {
    rows: [ExitRecord!]!
    totalCount: Int!
  }

  extend type Query {
    listExitRecords: [ExitRecord!]!
    listExitRecordsPaged(input: TableQueryInput!): ExitRecordPage!
    listExitRecordsStats: TableStats!
    getExitRecord(id: ID!): ExitRecord!
    "The signed-in employee's own exit record, if one has been opened."
    myExitRecord: ExitRecord
  }

  extend type Mutation {
    createExitRecord(input: ExitRecordInput!): ExitRecord!
    updateExitRecord(id: ID!, input: ExitRecordInput!): ExitRecord!
    deleteExitRecord(id: ID!): Boolean!
  }
`;

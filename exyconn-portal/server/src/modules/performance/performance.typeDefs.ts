import gql from 'graphql-tag';

export const performanceTypeDefs = gql`
  enum ReviewStatus {
    OPEN
    SELF_SUBMITTED
    MANAGER_SUBMITTED
    CLOSED
  }

  type PerformanceReview {
    id: ID!
    employeeId: String!
    cycle: String!
    selfAssessment: String!
    managerAssessment: String!
    competencies: String!
    score: Float
    rating: String
    actionPlan: String!
    status: ReviewStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input PerformanceReviewInput {
    employeeId: String!
    cycle: String!
    selfAssessment: String!
    managerAssessment: String!
    competencies: String!
    score: Float
    rating: String
    actionPlan: String!
    status: ReviewStatus!
  }

  type PerformanceReviewPage {
    rows: [PerformanceReview!]!
    totalCount: Int!
  }

  extend type Query {
    listPerformanceReviews: [PerformanceReview!]!
    listPerformanceReviewsPaged(input: TableQueryInput!): PerformanceReviewPage!
    listPerformanceReviewsStats: TableStats!
    getPerformanceReview(id: ID!): PerformanceReview!
    myPerformanceReviews: [PerformanceReview!]!
  }

  extend type Mutation {
    createPerformanceReview(input: PerformanceReviewInput!): PerformanceReview!
    updatePerformanceReview(id: ID!, input: PerformanceReviewInput!): PerformanceReview!
    deletePerformanceReview(id: ID!): Boolean!
    """
    The employee's own half of the appraisal. Allowed only while the cycle is
    still OPEN, and it never touches the manager's assessment or the rating.
    """
    submitSelfAssessment(id: ID!, text: String!): PerformanceReview!
  }
`;

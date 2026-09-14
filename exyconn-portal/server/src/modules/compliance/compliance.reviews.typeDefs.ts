import gql from 'graphql-tag';

export const complianceReviewsTypeDefs = gql`
  enum ManagementReviewStatus {
    PLANNED
    HELD
    MINUTED
  }

  "One action leadership agreed in the meeting, and whether it has since been done."
  type ManagementReviewAction {
    description: String!
    ownerName: String!
    dueOn: DateTime
    done: Boolean!
  }

  input ManagementReviewActionInput {
    description: String!
    ownerName: String!
    dueOn: DateTime
    done: Boolean!
  }

  """
  A management review (clause 9.3) — the meeting at which the people who run the company look
  at whether the management system is working and decide what to change.

  Its inputs are written text, not a live query: the standard asks what leadership CONSIDERED,
  and a minute that re-rendered from today's data would say something different every time.
  """
  type ManagementReview {
    id: ID!
    reference: String!
    title: String!
    standards: [ManagementStandard!]!
    heldOn: DateTime!
    chairName: String!
    attendees: String!
    inputs: String!
    decisions: String!
    actions: [ManagementReviewAction!]!
    "How much of what the meeting decided is still outstanding."
    openActionCount: Int!
    status: ManagementReviewStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ManagementReviewInput {
    title: String!
    standards: [ManagementStandard!]!
    heldOn: DateTime!
    chairName: String!
    attendees: String!
    inputs: String!
    decisions: String!
    actions: [ManagementReviewActionInput!]!
    status: ManagementReviewStatus!
  }

  type ManagementReviewPage {
    rows: [ManagementReview!]!
    totalCount: Int!
  }

  extend type Query {
    listManagementReviews: [ManagementReview!]!
    listManagementReviewsPaged(input: TableQueryInput!): ManagementReviewPage!
    listManagementReviewsStats: TableStats!
    getManagementReview(id: ID!): ManagementReview!
  }

  extend type Mutation {
    createManagementReview(input: ManagementReviewInput!): ManagementReview!
    updateManagementReview(id: ID!, input: ManagementReviewInput!): ManagementReview!
    deleteManagementReview(id: ID!): Boolean!
  }
`;

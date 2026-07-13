import gql from 'graphql-tag';

/**
 * `createWebsiteSubmission` is intentionally unauthenticated — the public website
 * posts every form through it. Reading and triaging submissions is role-guarded.
 */
export const submissionTypeDefs = gql`
  type WebsiteSubmission {
    id: ID!
    formType: String!
    source: String!
    submissionData: JSON!
    status: String!
    notes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input WebsiteSubmissionInput {
    formType: String!
    source: String
    submissionData: JSON!
    status: String
    notes: String
  }

  input WebsiteSubmissionTriageInput {
    status: String!
    notes: String
  }

  extend type Query {
    listWebsiteSubmissions: [WebsiteSubmission!]!
    getWebsiteSubmission(id: ID!): WebsiteSubmission!
  }

  extend type Mutation {
    createWebsiteSubmission(input: WebsiteSubmissionInput!): WebsiteSubmission!
    triageWebsiteSubmission(id: ID!, input: WebsiteSubmissionTriageInput!): WebsiteSubmission!
    deleteWebsiteSubmission(id: ID!): Boolean!
  }
`;

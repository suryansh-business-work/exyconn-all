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
    "The CRM lead this enquiry became, once it has been converted."
    leadId: String
    "The HR applicant a job application became, filed automatically on submission."
    applicantId: String
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

  type WebsiteSubmissionPage {
    rows: [WebsiteSubmission!]!
    totalCount: Int!
  }

  input WebsiteSubmissionTriageInput {
    status: String!
    notes: String
  }

  extend type Query {
    listWebsiteSubmissions: [WebsiteSubmission!]!
    listWebsiteSubmissionsPaged(input: TableQueryInput!): WebsiteSubmissionPage!
    listWebsiteSubmissionsStats: TableStats!
    "The form identifiers the public website may submit under — the one allow-list."
    websiteFormTypes: [String!]!
    getWebsiteSubmission(id: ID!): WebsiteSubmission!
  }

  extend type Mutation {
    createWebsiteSubmission(input: WebsiteSubmissionInput!): WebsiteSubmission!
    triageWebsiteSubmission(id: ID!, input: WebsiteSubmissionTriageInput!): WebsiteSubmission!
    deleteWebsiteSubmission(id: ID!): Boolean!
    "Files the enquiry as a CRM lead. Once only: the submission remembers the lead it became."
    convertWebsiteSubmissionToLead(id: ID!): Lead!
  }
`;

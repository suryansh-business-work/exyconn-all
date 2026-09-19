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

  "A security question for a public form, and the signed token that says which it was."
  type WebsiteCaptcha {
    token: String!
    question: String!
  }

  input WebsiteCaptchaAnswer {
    token: String!
    answer: String!
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
    "A fresh security question for a public form. Public; each is good for one answer, 10 minutes."
    websiteCaptcha: WebsiteCaptcha!
    getWebsiteSubmission(id: ID!): WebsiteSubmission!
  }

  extend type Mutation {
    "Public. Refused unless \`captcha\` answers a question from \`websiteCaptcha\`."
    createWebsiteSubmission(
      input: WebsiteSubmissionInput!
      captcha: WebsiteCaptchaAnswer!
    ): WebsiteSubmission!
    triageWebsiteSubmission(id: ID!, input: WebsiteSubmissionTriageInput!): WebsiteSubmission!
    deleteWebsiteSubmission(id: ID!): Boolean!
    "Files the enquiry as a CRM lead. Once only: the submission remembers the lead it became."
    convertWebsiteSubmissionToLead(id: ID!): Lead!
  }
`;

import gql from 'graphql-tag';

export const recruitingTypeDefs = gql`
  enum ApplicantSource {
    WEBSITE
    REFERRAL
    MANUAL
  }

  enum ApplicantStage {
    NEW
    SCREENING
    INTERVIEW
    OFFER
    HIRED
    REJECTED
  }

  "A candidate for one job, moved through the pipeline from HR > Applicants."
  type Applicant {
    id: ID!
    jobCode: String!
    jobTitle: String!
    companySlug: String!
    name: String!
    email: String!
    phone: String!
    resumeUrl: String!
    coverLetter: String!
    source: ApplicantSource!
    stage: ApplicantStage!
    "0 = not rated yet, otherwise 1–5."
    rating: Int!
    "Append-only history: one line per stage move."
    notes: String!
    submissionId: String!
    stageChangedAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ApplicantInput {
    jobCode: String!
    jobTitle: String!
    companySlug: String
    name: String!
    email: String!
    phone: String!
    resumeUrl: String!
    coverLetter: String!
    source: ApplicantSource!
    rating: Int!
  }

  type ApplicantPage {
    rows: [Applicant!]!
    totalCount: Int!
  }

  extend type Query {
    listApplicants: [Applicant!]!
    listApplicantsPaged(input: TableQueryInput!): ApplicantPage!
    listApplicantsStats: TableStats!
    getApplicant(id: ID!): Applicant!
  }

  extend type Mutation {
    createApplicant(input: ApplicantInput!): Applicant!
    updateApplicant(id: ID!, input: ApplicantInput!): Applicant!
    deleteApplicant(id: ID!): Boolean!
    "Moves an applicant along the pipeline. The applicant is emailed on INTERVIEW, OFFER and REJECTED."
    setApplicantStage(id: ID!, stage: ApplicantStage!, note: String): Applicant!
  }
`;

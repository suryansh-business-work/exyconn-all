import gql from 'graphql-tag';

/**
 * `category`, `jobType`, `experienceLevel` and `workMode` are Strings rather than
 * GraphQL enums: their values ("Full Time", "AI/ML", "On-site") are rendered
 * verbatim by the website and are not valid GraphQL enum names. Mongoose validates
 * them against `website.constants.ts`.
 */
export const jobTypeDefs = gql`
  type Job {
    id: ID!
    jobCode: String!
    companySlug: String!
    title: String!
    category: String!
    skillSet: [String!]!
    shortJobDescription: String!
    jobDescription: String!
    jobResponsibilities: String!
    requirements: [String!]!
    niceToHave: [String!]!
    benefits: [String!]!
    location: String!
    jobType: String!
    experienceLevel: String!
    workMode: String!
    salaryRange: String!
    jobPostDate: DateTime!
    applicationDeadline: DateTime
    isActive: Boolean!
    isFeatured: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input JobInput {
    jobCode: String!
    companySlug: String!
    title: String!
    category: String!
    skillSet: [String!]
    shortJobDescription: String
    jobDescription: String
    jobResponsibilities: String
    requirements: [String!]
    niceToHave: [String!]
    benefits: [String!]
    location: String
    jobType: String!
    experienceLevel: String!
    workMode: String!
    salaryRange: String
    jobPostDate: DateTime
    applicationDeadline: DateTime
    isActive: Boolean
    isFeatured: Boolean
  }

  extend type Query {
    listJobs: [Job!]!
    getJob(id: ID!): Job!
    publicJobs(companySlug: String): [Job!]!
    publicJob(jobCode: String!): Job
  }

  extend type Mutation {
    createJob(input: JobInput!): Job!
    updateJob(id: ID!, input: JobInput!): Job!
    deleteJob(id: ID!): Boolean!
  }
`;

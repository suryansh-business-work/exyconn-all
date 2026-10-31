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
    "The website it belongs to (Website > Websites)."
    siteId: String!
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
    "Its own search and share meta; null on items saved before it existed."
    seo: ItemSeo
  }

  input JobInput {
    siteId: String
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
    seo: ItemSeoInput
  }

  type JobPage {
    rows: [Job!]!
    totalCount: Int!
  }

  extend type Query {
    listJobs: [Job!]!
    listJobsPaged(input: TableQueryInput!): JobPage!
    listJobsStats: TableStats!
    getJob(id: ID!): Job!
    "Public: lists a site's active job openings, newest first."
    publicJobs(
      "Only this hiring company's jobs; every company when left out."
      companySlug: String
      "The site's key; the default site when left out."
      site: String
    ): [Job!]!
    "Public: reads one active job opening by its code; null when there is none."
    publicJob(
      "The job's public code."
      jobCode: String!
      "The site's key; the default site when left out."
      site: String
    ): Job
  }

  extend type Mutation {
    createJob(input: JobInput!): Job!
    updateJob(id: ID!, input: JobInput!): Job!
    deleteJob(id: ID!): Boolean!
  }
`;

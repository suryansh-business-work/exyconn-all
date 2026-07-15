import gql from 'graphql-tag';

export const caseStudyTypeDefs = gql`
  type CaseStudy {
    id: ID!
    slug: String!
    title: String!
    excerpt: String!
    content: String!
    coverImage: String!
    category: String!
    author: String!
    tags: [String!]!
    pdfUrl: String!
    featured: Boolean!
    isActive: Boolean!
    publishedAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CaseStudyInput {
    slug: String!
    title: String!
    excerpt: String
    content: String
    coverImage: String
    category: String
    author: String
    tags: [String!]
    pdfUrl: String
    featured: Boolean
    isActive: Boolean
    publishedAt: DateTime
  }

  type CaseStudyPage {
    rows: [CaseStudy!]!
    totalCount: Int!
  }

  extend type Query {
    listCaseStudies: [CaseStudy!]!
    listCaseStudiesPaged(input: TableQueryInput!): CaseStudyPage!
    listCaseStudiesStats: TableStats!
    getCaseStudy(id: ID!): CaseStudy!
    publicCaseStudies: [CaseStudy!]!
    publicCaseStudy(slug: String!): CaseStudy
  }

  extend type Mutation {
    createCaseStudy(input: CaseStudyInput!): CaseStudy!
    updateCaseStudy(id: ID!, input: CaseStudyInput!): CaseStudy!
    deleteCaseStudy(id: ID!): Boolean!
  }
`;

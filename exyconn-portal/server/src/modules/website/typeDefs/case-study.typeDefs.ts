import gql from 'graphql-tag';

export const caseStudyTypeDefs = gql`
  type CaseStudy {
    id: ID!
    "The website it belongs to (Website > Websites)."
    siteId: String!
    slug: String!
    title: String!
    excerpt: String!
    content: String!
    "CSS the live editor generated for the body; empty for a rich-text body."
    contentCss: String!
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
    siteId: String
    slug: String!
    title: String!
    excerpt: String
    content: String
    contentCss: String
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
    publicCaseStudies(site: String): [CaseStudy!]!
    publicCaseStudy(slug: String!, site: String): CaseStudy
  }

  extend type Mutation {
    createCaseStudy(input: CaseStudyInput!): CaseStudy!
    updateCaseStudy(id: ID!, input: CaseStudyInput!): CaseStudy!
    deleteCaseStudy(id: ID!): Boolean!
  }
`;

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
    "Its own search and share meta; null on items saved before it existed."
    seo: ItemSeo
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
    seo: ItemSeoInput
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
    "Public: lists a site's active case studies whose publish date has passed, newest first."
    publicCaseStudies("The site's key; the default site when left out." site: String): [CaseStudy!]!
    "Public: reads one active, already published case study by its address; null when there is none."
    publicCaseStudy(
      "The case study's URL slug."
      slug: String!
      "The site's key; the default site when left out."
      site: String
    ): CaseStudy
  }

  extend type Mutation {
    createCaseStudy(input: CaseStudyInput!): CaseStudy!
    updateCaseStudy(id: ID!, input: CaseStudyInput!): CaseStudy!
    deleteCaseStudy(id: ID!): Boolean!
  }
`;

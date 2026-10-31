import gql from 'graphql-tag';

export const gigTypeDefs = gql`
  type Gig {
    id: ID!
    "The website it belongs to (Website > Websites)."
    siteId: String!
    gigCode: String!
    title: String!
    category: String!
    shortDescription: String!
    fullDescription: String!
    deliverables: [String!]!
    requirements: [String!]!
    tags: [String!]!
    budget: String!
    duration: String!
    status: String!
    applicationType: String!
    applicationContact: String!
    postedDate: DateTime!
    deadline: DateTime
    isUrgent: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    "Its own search and share meta; null on items saved before it existed."
    seo: ItemSeo
  }

  input GigInput {
    siteId: String
    gigCode: String!
    title: String!
    category: String!
    shortDescription: String
    fullDescription: String
    deliverables: [String!]
    requirements: [String!]
    tags: [String!]
    budget: String
    duration: String!
    status: String!
    applicationType: String!
    applicationContact: String!
    postedDate: DateTime
    deadline: DateTime
    isUrgent: Boolean
    seo: ItemSeoInput
  }

  type GigPage {
    rows: [Gig!]!
    totalCount: Int!
  }

  extend type Query {
    listGigs: [Gig!]!
    listGigsPaged(input: TableQueryInput!): GigPage!
    listGigsStats: TableStats!
    getGig(id: ID!): Gig!
    "Public: lists a site's gigs, newest first."
    publicGigs("The site's key; the default site when left out." site: String): [Gig!]!
    "Public: reads one gig by its code; null when there is none."
    publicGig(
      "The gig's public code."
      gigCode: String!
      "The site's key; the default site when left out."
      site: String
    ): Gig
  }

  extend type Mutation {
    createGig(input: GigInput!): Gig!
    updateGig(id: ID!, input: GigInput!): Gig!
    deleteGig(id: ID!): Boolean!
  }
`;

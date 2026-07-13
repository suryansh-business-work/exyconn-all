import gql from 'graphql-tag';

export const gigTypeDefs = gql`
  type Gig {
    id: ID!
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
  }

  input GigInput {
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
  }

  extend type Query {
    listGigs: [Gig!]!
    getGig(id: ID!): Gig!
    publicGigs: [Gig!]!
    publicGig(gigCode: String!): Gig
  }

  extend type Mutation {
    createGig(input: GigInput!): Gig!
    updateGig(id: ID!, input: GigInput!): Gig!
    deleteGig(id: ID!): Boolean!
  }
`;

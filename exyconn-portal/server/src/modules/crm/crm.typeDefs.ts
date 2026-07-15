import gql from 'graphql-tag';

export const crmTypeDefs = gql`
  enum LeadSource {
    WEBSITE
    REFERRAL
    ADS
    EVENT
  }
  enum LeadStage {
    NEW
    CONTACTED
    QUALIFIED
    WON
    LOST
  }

  type Lead {
    id: ID!
    name: String!
    email: String!
    source: LeadSource!
    stage: LeadStage!
    value: Float!
    owner: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input LeadInput {
    name: String!
    email: String!
    source: LeadSource!
    stage: LeadStage!
    value: Float!
    owner: String!
  }

  type LeadPage {
    rows: [Lead!]!
    totalCount: Int!
  }

  extend type Query {
    listLeads: [Lead!]!
    listLeadsPaged(input: TableQueryInput!): LeadPage!
    listLeadsStats: TableStats!
    getLead(id: ID!): Lead!
  }

  extend type Mutation {
    createLead(input: LeadInput!): Lead!
    updateLead(id: ID!, input: LeadInput!): Lead!
    deleteLead(id: ID!): Boolean!
  }
`;

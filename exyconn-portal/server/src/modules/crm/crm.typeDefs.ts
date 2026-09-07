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
    notes: String!
    "The campaign that produced this lead, when it came from one."
    campaignId: String!
    campaignName: String!
    "The deal this lead was converted into, once it has been."
    convertedDealId: String
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
    notes: String
    "Attribution. The campaign's name is filled in by the server from this id."
    campaignId: String
  }

  "What a lead becomes: an account, a person at it and an opportunity."
  input ConvertLeadInput {
    companyName: String!
    dealTitle: String!
    value: Float!
    expectedCloseDate: DateTime
    contactName: String
    contactEmail: String
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
    "Turns a lead into a company, a contact and a deal at the top of the pipeline. Once only."
    convertLead(id: ID!, input: ConvertLeadInput!): Deal!
  }
`;

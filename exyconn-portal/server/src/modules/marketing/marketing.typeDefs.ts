import gql from 'graphql-tag';

export const marketingTypeDefs = gql`
  enum CampaignChannel {
    EMAIL
    SOCIAL
    SEARCH
    DISPLAY
  }
  enum CampaignStatus {
    PLANNED
    ACTIVE
    PAUSED
    COMPLETED
  }

  type Campaign {
    id: ID!
    name: String!
    channel: CampaignChannel!
    budget: Float!
    startDate: DateTime!
    endDate: DateTime!
    status: CampaignStatus!
    subject: String
    body: String
    lastSentAt: DateTime
    "Recipients reached by the last send. Null for campaigns never sent / created before email support."
    recipientsCount: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CampaignInput {
    name: String!
    channel: CampaignChannel!
    budget: Float!
    startDate: DateTime!
    endDate: DateTime!
    status: CampaignStatus!
    subject: String
    body: String
  }

  "Outcome of a campaign email blast."
  type CampaignSendResult {
    sent: Int!
    failed: Int!
    campaign: Campaign!
  }

  extend type Query {
    listCampaigns: [Campaign!]!
    getCampaign(id: ID!): Campaign!
  }

  extend type Mutation {
    createCampaign(input: CampaignInput!): Campaign!
    updateCampaign(id: ID!, input: CampaignInput!): Campaign!
    deleteCampaign(id: ID!): Boolean!
    "Emails the campaign's subject/body to the selected clients."
    sendCampaign(id: ID!, clientIds: [ID!]!): CampaignSendResult!
  }
`;

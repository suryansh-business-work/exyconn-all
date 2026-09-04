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

  "A saved set of clients a campaign can be sent to."
  type AudienceList {
    id: ID!
    name: String!
    description: String!
    clientIds: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input AudienceListInput {
    name: String!
    description: String
    clientIds: [String!]
  }

  type AudienceListPage {
    rows: [AudienceList!]!
    totalCount: Int!
  }

  enum CampaignSendStatus {
    SENT
    FAILED
  }

  "One recipient's copy of one campaign send, kept whether it worked or not."
  type CampaignSend {
    id: ID!
    campaignId: String!
    audienceListId: String!
    to: String!
    recipientName: String!
    status: CampaignSendStatus!
    error: String!
    sentAt: DateTime!
  }

  type CampaignPage {
    rows: [Campaign!]!
    totalCount: Int!
  }

  extend type Query {
    listCampaigns: [Campaign!]!
    listCampaignsPaged(input: TableQueryInput!): CampaignPage!
    listCampaignsStats: TableStats!
    getCampaign(id: ID!): Campaign!
    listAudienceLists: [AudienceList!]!
    listAudienceListsPaged(input: TableQueryInput!): AudienceListPage!
    getAudienceList(id: ID!): AudienceList!
    "Every recipient of a campaign's sends, newest first."
    listCampaignSends(campaignId: ID!): [CampaignSend!]!
  }

  extend type Mutation {
    createCampaign(input: CampaignInput!): Campaign!
    updateCampaign(id: ID!, input: CampaignInput!): Campaign!
    deleteCampaign(id: ID!): Boolean!
    createAudienceList(input: AudienceListInput!): AudienceList!
    updateAudienceList(id: ID!, input: AudienceListInput!): AudienceList!
    deleteAudienceList(id: ID!): Boolean!
    "Emails the campaign's subject/body to every client in the audience list."
    sendCampaign(id: ID!, audienceListId: ID!): CampaignSendResult!
  }
`;

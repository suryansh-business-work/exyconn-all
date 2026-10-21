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
    "The ISO 4217 currency the budget is set in."
    budgetCurrency: String!
    startDate: DateTime!
    endDate: DateTime!
    status: CampaignStatus!
    subject: String
    body: String
    "A stored email template to render through instead of the raw body."
    templateKey: String
    lastSentAt: DateTime
    "Recipients reached by the last send. Null for campaigns never sent / created before email support."
    recipientsCount: Int
    "When the dispatcher should send this campaign unattended."
    scheduledAt: DateTime
    "The audience a scheduled send goes to."
    scheduledAudienceListId: String
    "Stamped when the dispatcher claimed the campaign; what stops a second send."
    scheduleDispatchedAt: DateTime
    campaignType: CampaignType!
    preferenceCategoryId: String!
    senderName: String!
    senderEmail: String!
    replyTo: String!
    preheader: String!
    editorMode: EditorMode!
    "The visual editor's blocks."
    blocks: JSON!
    mjml: String!
    html: String!
    text: String!
    contentVersion: Int!
    trackOpens: Boolean!
    trackClicks: Boolean!
    sendState: CampaignSendState!
    sendingRevisionId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CampaignInput {
    name: String!
    channel: CampaignChannel!
    budget: Float!
    "The ISO 4217 currency the budget is set in."
    budgetCurrency: String!
    startDate: DateTime!
    endDate: DateTime!
    status: CampaignStatus!
    subject: String
    body: String
    templateKey: String
    scheduledAt: DateTime
    scheduledAudienceListId: String
  }

  "Sent, failed and skipped for one campaign, counted by the server."
  type CampaignSendSummary {
    sent: Int!
    failed: Int!
    skipped: Int!
  }

  "A campaign as a pickable option, for attributing a lead to it."
  type CampaignOption {
    id: ID!
    name: String!
  }

  "How many leads one campaign has been credited with."
  type CampaignLeadCount {
    campaignId: String!
    campaignName: String!
    leads: Int!
  }

  enum CampaignSendStatus {
    QUEUED
    SENT
    FAILED
    SKIPPED
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
    "Every recipient of a campaign's sends, newest first."
    listCampaignSends(campaignId: ID!): [CampaignSend!]!
    "Sent, failed and skipped counts for one campaign."
    campaignSendSummary(campaignId: ID!): CampaignSendSummary!
    "Campaigns as pickable options, so a lead can be attributed to one. CRM may read these."
    campaignOptions: [CampaignOption!]!
    "How many leads carry this campaign's attribution."
    leadsByCampaign(campaignId: ID!): Int!
    "Leads per campaign, most productive first — the overview's attribution figures."
    campaignLeadCounts: [CampaignLeadCount!]!
  }

  extend type Mutation {
    createCampaign(input: CampaignInput!): Campaign!
    updateCampaign(id: ID!, input: CampaignInput!): Campaign!
    deleteCampaign(id: ID!): Boolean!

    """
    Public: honours the unsubscribe link in a campaign email. Idempotent — the link is
    clicked twice, forwarded and prefetched, and none of that is an error worth showing.
    """
    unsubscribeFromMarketing(token: String!): Boolean!
  }
`;

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
    templateKey: String
    scheduledAt: DateTime
    scheduledAudienceListId: String
  }

  "Outcome of a campaign email blast."
  type CampaignSendResult {
    sent: Int!
    failed: Int!
    "Recipients deliberately not written to — suppressed, or consent withdrawn."
    skipped: Int!
    campaign: Campaign!
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

  "The first audience member's copy, rendered exactly as the send would render it."
  type CampaignPreview {
    recipient: String!
    subject: String!
    body: String!
  }

  "A rule that picks audience members without anybody maintaining the list."
  enum AudienceSegment {
    NONE
    ALL_ACTIVE_CLIENTS
    ALL_ACTIVE_CONTACTS
    CONTACTS_BY_COMPANY_STATUS
  }

  "A saved set of people a campaign can be sent to: named clients, named contacts, a segment."
  type AudienceList {
    id: ID!
    name: String!
    description: String!
    clientIds: [String!]!
    contactIds: [String!]!
    dynamicSegment: AudienceSegment!
    "The segment's parameter, e.g. the CompanyStatus for CONTACTS_BY_COMPANY_STATUS."
    segmentValue: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input AudienceListInput {
    name: String!
    description: String
    clientIds: [String!]
    contactIds: [String!]
    dynamicSegment: AudienceSegment
    segmentValue: String
  }

  "Which register a resolved member came out of."
  enum AudienceMemberKind {
    CLIENT
    CONTACT
  }

  "One resolved recipient of an audience, after de-duplication by address."
  type AudienceMember {
    id: ID!
    email: String!
    name: String!
    company: String!
    status: String!
    kind: AudienceMemberKind!
  }

  "Why an address is on the marketing suppression list."
  enum SuppressionReason {
    UNSUBSCRIBED
    BOUNCED
    MANUAL
  }

  "One address marketing must never write to again."
  type MarketingSuppression {
    id: ID!
    email: String!
    reason: SuppressionReason!
    source: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input MarketingSuppressionInput {
    email: String!
    reason: SuppressionReason!
    source: String
  }

  type MarketingSuppressionPage {
    rows: [MarketingSuppression!]!
    totalCount: Int!
  }

  type AudienceListPage {
    rows: [AudienceList!]!
    totalCount: Int!
  }

  enum CampaignSendStatus {
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
    listAudienceLists: [AudienceList!]!
    listAudienceListsPaged(input: TableQueryInput!): AudienceListPage!
    getAudienceList(id: ID!): AudienceList!
    "Every recipient of a campaign's sends, newest first."
    listCampaignSends(campaignId: ID!): [CampaignSend!]!
    "Sent, failed and skipped counts for one campaign."
    campaignSendSummary(campaignId: ID!): CampaignSendSummary!
    "Who an audience currently reaches: named members plus its segment, de-duplicated."
    audienceMembers(id: ID!): [AudienceMember!]!
    "The first member's copy, rendered by the same code the send uses. Null for an empty audience."
    campaignPreview(id: ID!, audienceListId: ID!): CampaignPreview
    "Campaigns as pickable options, so a lead can be attributed to one. CRM may read these."
    campaignOptions: [CampaignOption!]!
    "How many leads carry this campaign's attribution."
    leadsByCampaign(campaignId: ID!): Int!
    "Leads per campaign, most productive first — the overview's attribution figures."
    campaignLeadCounts: [CampaignLeadCount!]!

    listMarketingSuppressions: [MarketingSuppression!]!
    listMarketingSuppressionsPaged(input: TableQueryInput!): MarketingSuppressionPage!
    listMarketingSuppressionsStats: TableStats!
    getMarketingSuppression(id: ID!): MarketingSuppression!
  }

  extend type Mutation {
    createCampaign(input: CampaignInput!): Campaign!
    updateCampaign(id: ID!, input: CampaignInput!): Campaign!
    deleteCampaign(id: ID!): Boolean!
    createAudienceList(input: AudienceListInput!): AudienceList!
    updateAudienceList(id: ID!, input: AudienceListInput!): AudienceList!
    deleteAudienceList(id: ID!): Boolean!
    """
    Emails the campaign's subject/body to every client in the audience list. With
    testEmail it goes to that one address only — a preview that needs no audience and
    leaves no send log or last-sent stamp behind.
    """
    sendCampaign(id: ID!, audienceListId: ID, testEmail: String): CampaignSendResult!

    createMarketingSuppression(input: MarketingSuppressionInput!): MarketingSuppression!
    updateMarketingSuppression(id: ID!, input: MarketingSuppressionInput!): MarketingSuppression!
    "Deleting the row is how somebody is re-subscribed; there is no other way back."
    deleteMarketingSuppression(id: ID!): Boolean!

    """
    Public: honours the unsubscribe link in a campaign email. Idempotent — the link is
    clicked twice, forwarded and prefetched, and none of that is an error worth showing.
    """
    unsubscribeFromMarketing(token: String!): Boolean!
  }
`;

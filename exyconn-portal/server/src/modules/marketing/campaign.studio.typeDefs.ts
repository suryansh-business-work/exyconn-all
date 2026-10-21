import gql from 'graphql-tag';

export const campaignStudioTypeDefs = gql`
  enum CampaignType {
    PROMOTIONAL
    NEWSLETTER
    ANNOUNCEMENT
    EVENT
    FOLLOW_UP
    OTHER
  }

  enum EditorMode {
    VISUAL
    CODE
  }

  "Where the email delivery stands, separate from the campaign's marketing status."
  enum CampaignSendState {
    DRAFT
    QUEUED
    SENDING
    SENT
    CANCELLED
    FAILED
  }

  enum CheckSeverity {
    ERROR
    WARNING
    INFO
  }

  enum PreviewRecordKind {
    CONTACT
    COMPANY
  }

  "A draft as the Email Studio saves it. Only the name is needed for a first save."
  input CampaignDraftInput {
    name: String!
    channel: CampaignChannel
    status: CampaignStatus
    campaignType: CampaignType
    preferenceCategoryId: String
    senderName: String
    senderEmail: String
    replyTo: String
    subject: String
    preheader: String
    editorMode: EditorMode
    blocks: JSON
    mjml: String
    budget: Float
    "The ISO 4217 currency the budget is set in. A new draft without one takes the company's."
    budgetCurrency: String
    startDate: DateTime
    endDate: DateTime
    trackOpens: Boolean
    trackClicks: Boolean
    "The audience chosen in the Audience step."
    scheduledAudienceListId: String
  }

  "One variable an email can use."
  type CampaignVariable {
    key: String!
    group: String!
    label: String!
    description: String!
    example: String!
  }

  "A kind of marketing email recipients can turn off."
  type PreferenceCategory {
    id: ID!
    name: String!
    description: String!
    isActive: Boolean!
    sortOrder: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input PreferenceCategoryInput {
    name: String!
    description: String
    isActive: Boolean!
    sortOrder: Int
  }

  type PreferenceCategoryPage {
    rows: [PreferenceCategory!]!
    totalCount: Int!
  }

  "What the studio needs to offer: verified senders, variables and categories."
  type CampaignStudioOptions {
    verifiedSenders: [String!]!
    variables: [CampaignVariable!]!
    categories: [PreferenceCategory!]!
  }

  type MjmlIssue {
    line: Int!
    message: String!
  }

  type PreviewRecipient {
    kind: String!
    name: String!
    email: String!
  }

  input CampaignPreviewInput {
    campaignName: String!
    senderName: String!
    subject: String!
    preheader: String!
    mjml: String!
    recordKind: PreviewRecordKind
    recordId: String
  }

  "The email as one recipient would get it, built by the pipeline the send uses."
  type CampaignPreviewResult {
    subject: String!
    preheader: String!
    html: String!
    text: String!
    issues: [MjmlIssue!]!
    missingVariables: [String!]!
    recipient: PreviewRecipient!
  }

  type QualityCheck {
    code: String!
    severity: CheckSeverity!
    message: String!
    line: Int
  }

  "Everything checked before a real send; ERRORs block it."
  type CampaignQualityReport {
    checks: [QualityCheck!]!
    "The audience's counts for this campaign's category; null without an audience."
    counts: AudienceCounts
    canSend: Boolean!
  }

  "A record to preview as."
  type PreviewRecordOption {
    kind: PreviewRecordKind!
    id: ID!
    name: String!
    email: String!
  }

  type CampaignRevision {
    id: ID!
    version: Int!
    subject: String!
    createdByName: String!
    createdAt: DateTime!
  }

  "What the latest send of a campaign did. bounced is null: no provider reports them here."
  type CampaignDeliveryStats {
    runId: String!
    sendState: CampaignSendState!
    scheduledAt: DateTime
    lastSentAt: DateTime
    resolved: Int!
    eligible: Int!
    queued: Int!
    sent: Int!
    failed: Int!
    skipped: Int!
    bounced: Int
    unsubscribed: Int!
    preferenceChanges: Int!
    clicked: Int!
    "Opens are an estimate: privacy proxies and blocked images hide or invent them."
    estimatedOpens: Int!
    clickRate: Int!
  }

  type CampaignTemplate {
    id: ID!
    name: String!
    category: String!
    description: String!
    editorMode: EditorMode!
    blocks: JSON!
    mjml: String!
    version: Int!
    updatedByName: String!
    updatedAt: DateTime!
  }

  input CampaignTemplateInput {
    name: String!
    category: String
    description: String
    editorMode: EditorMode!
    blocks: JSON
    mjml: String!
    note: String
  }

  type CampaignTemplateVersion {
    id: ID!
    version: Int!
    note: String!
    createdByName: String!
    createdAt: DateTime!
  }

  "A Tech > Email template offered as a starting point."
  type TechEmailTemplateOption {
    key: String!
    name: String!
    mjml: String!
  }

  type MarketingFooter {
    companyName: String!
    contactLine: String!
    postalAddress: String!
    privacyUrl: String!
    websiteUrl: String!
    textColor: String!
    linkColor: String!
  }

  input MarketingFooterInput {
    companyName: String!
    contactLine: String
    postalAddress: String!
    privacyUrl: String
    websiteUrl: String
    textColor: String
    linkColor: String
  }

  type DashboardDay {
    day: String!
    sent: Int!
  }

  type DashboardCampaign {
    id: ID!
    name: String!
    at: DateTime
    recipients: Int
    sendState: CampaignSendState
  }

  type MarketingDashboard {
    campaigns: Int!
    drafts: Int!
    scheduled: Int!
    sending: Int!
    sentLast30: Int!
    failedLast30: Int!
    clickedLast30: Int!
    clickRateLast30: Int!
    unsubscribesLast30: Int!
    suppressed: Int!
    audiences: Int!
    upcoming: [DashboardCampaign!]!
    recent: [DashboardCampaign!]!
    daily: [DashboardDay!]!
  }

  "A category on the public preference page."
  type PublicPreferenceCategory {
    id: ID!
    name: String!
    description: String!
    subscribed: Boolean!
  }

  "The public preference page's view of one recipient. The address is masked."
  type PublicEmailPreferences {
    email: String!
    preview: Boolean!
    unsubscribedAll: Boolean!
    categories: [PublicPreferenceCategory!]!
  }

  extend type Query {
    campaignStudioOptions: CampaignStudioOptions!
    previewCampaignContent(input: CampaignPreviewInput!): CampaignPreviewResult!
    campaignQualityChecks(id: ID!, audienceListId: ID): CampaignQualityReport!
    "Contacts and companies matching a search, to preview the email as one of them."
    previewRecordOptions(search: String!): [PreviewRecordOption!]!
    campaignRevisions(campaignId: ID!): [CampaignRevision!]!
    campaignDeliveryStats(campaignId: ID!): CampaignDeliveryStats!
    marketingDashboard: MarketingDashboard!
    listCampaignTemplates: [CampaignTemplate!]!
    campaignTemplateVersions(templateId: ID!): [CampaignTemplateVersion!]!
    techEmailTemplateOptions: [TechEmailTemplateOption!]!
    listPreferenceCategories: [PreferenceCategory!]!
    listPreferenceCategoriesPaged(input: TableQueryInput!): PreferenceCategoryPage!
    getPreferenceCategory(id: ID!): PreferenceCategory!
    marketingFooter: MarketingFooter!
    "Public: a recipient's choices, by the token in their email."
    emailPreferences(token: String!): PublicEmailPreferences!
  }

  extend type Mutation {
    "Creates (no id) or updates a draft. expectedVersion refuses a save over somebody else's."
    saveCampaignDraft(id: ID, input: CampaignDraftInput!, expectedVersion: Int): Campaign!
    "Freezes the draft and queues it — now, or at scheduledAt. Refused while any check fails."
    queueCampaignSend(id: ID!, audienceListId: ID!, scheduledAt: DateTime): Campaign!
    "Unschedules a queued send, or stops a running one before its next batch."
    cancelCampaignSend(id: ID!): Campaign!
    "Sends the latest run's failed copies again; nobody gets a second copy."
    retryCampaignFailures(id: ID!): CampaignSendSummary!
    "A [TEST] copy to a portal user's address: preview links, no tracking, not logged."
    sendCampaignTest(
      id: ID!
      to: String!
      recordKind: PreviewRecordKind
      recordId: String
    ): Boolean!
    saveCampaignTemplate(id: ID, input: CampaignTemplateInput!): CampaignTemplate!
    duplicateCampaignTemplate(id: ID!): CampaignTemplate!
    restoreCampaignTemplateVersion(templateId: ID!, version: Int!): CampaignTemplate!
    deleteCampaignTemplate(id: ID!): Boolean!
    createPreferenceCategory(input: PreferenceCategoryInput!): PreferenceCategory!
    updatePreferenceCategory(id: ID!, input: PreferenceCategoryInput!): PreferenceCategory!
    deletePreferenceCategory(id: ID!): Boolean!
    saveMarketingFooter(input: MarketingFooterInput!): MarketingFooter!
    "Public: saves a recipient's choices. Unsubscribing from all goes on the suppression list."
    updateEmailPreferences(
      token: String!
      optedOutCategoryIds: [String!]!
      unsubscribeAll: Boolean!
    ): PublicEmailPreferences!
  }
`;

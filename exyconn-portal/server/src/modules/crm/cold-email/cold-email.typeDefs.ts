import gql from 'graphql-tag';

/** CRM > Cold emails: AI-written first emails to a contact or company, in several versions. */
export const coldEmailTypeDefs = gql`
  enum ColdEmailTone {
    FRIENDLY
    FORMAL
    BRIEF
  }

  enum ColdEmailStatus {
    DRAFT
    "One of its versions has been sent."
    SENT
  }

  "One AI-written version of a cold email, which the person may edit before sending."
  type ColdEmailVariant {
    id: ID!
    subject: String!
    body: String!
    "What this version was asked to do differently; empty for the first one."
    instruction: String!
    tone: ColdEmailTone!
    "What the AI run cost, in US dollars."
    costUsd: Float!
    createdAt: DateTime!
    sentAt: DateTime
    "The stored email message it went out as (Emails tab); empty until sent."
    sentMessageId: String!
  }

  "A cold email being prepared for one contact or company, with every version written so far."
  type ColdEmailDraft {
    id: ID!
    object: CrmTimelineObject!
    recordId: ID!
    recordName: String!
    "One of the record's addresses (a company's include its people's)."
    toEmail: String!
    "What we are offering, in the person's words; empty means an introduction to the company."
    goal: String!
    tone: ColdEmailTone!
    status: ColdEmailStatus!
    variants: [ColdEmailVariant!]!
    variantCount: Int!
    "The most versions one draft may hold; generating stops there."
    maxVariants: Int!
    createdByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ColdEmailDraftPage {
    rows: [ColdEmailDraft!]!
    totalCount: Int!
  }

  input CreateColdEmailDraftInput {
    object: CrmTimelineObject!
    recordId: ID!
    toEmail: String!
    goal: String
    tone: ColdEmailTone!
    "Read their website through Firecrawl first; costs a Firecrawl call."
    readWebsite: Boolean
    "How many versions to write straight away, in one AI run: 1 to 4, default 4."
    variantCount: Int
  }

  input SendColdEmailVariantInput {
    draftId: ID!
    variantId: ID!
    "The connected Gmail or Microsoft mailbox to send from (crmEmailSenders)."
    fromAccountId: ID!
    subject: String!
    body: String!
  }

  extend type Query {
    coldEmailDrafts(input: TableQueryInput!): ColdEmailDraftPage!
    coldEmailDraft(id: ID!): ColdEmailDraft!
  }

  extend type Mutation {
    "Writes the first versions (4 by default) with the AI from the record's business context; spends AI budget."
    createColdEmailDraft(input: CreateColdEmailDraftInput!): ColdEmailDraft!
    "Writes another version (at most 10 per draft); spends AI budget."
    addColdEmailVariant(id: ID!, instruction: String, tone: ColdEmailTone): ColdEmailDraft!
    "Writes fresh versions (up to 4, within the 10 per draft) from the record's latest data; spends AI budget."
    rewriteColdEmailDraft(
      id: ID!
      "Read their website through Firecrawl again first; costs a Firecrawl call."
      readWebsite: Boolean
    ): ColdEmailDraft!
    updateColdEmailVariant(
      draftId: ID!
      variantId: ID!
      subject: String!
      body: String!
    ): ColdEmailDraft!
    deleteColdEmailVariant(draftId: ID!, variantId: ID!): ColdEmailDraft!
    deleteColdEmailDraft(id: ID!): Boolean!
    "Sends one version from a CRM mailbox; it shows on the record's Emails tab and timeline."
    sendColdEmailVariant(input: SendColdEmailVariantInput!): ColdEmailDraft!
  }
`;

import gql from 'graphql-tag';

export const clutchTypeDefs = gql`
  "Which engine a Clutch search ran on: Clutch's own MCP server (free) or an Apify scraper."
  enum ClutchEngine {
    MCP
    APIFY
  }

  enum ClutchRunStatus {
    RUNNING
    SUCCEEDED
    FAILED
  }

  type ClutchReview {
    title: String!
    rating: Float
    comment: String!
    reviewer: String!
    reviewerTitle: String!
    industry: String!
    projectSize: String!
    date: String!
  }

  type ClutchPortfolioItem {
    title: String!
    description: String!
    imageUrl: String!
  }

  "A person listed at the company, with a way to reach them."
  type ClutchPerson {
    name: String!
    title: String!
    email: String!
    phone: String!
  }

  "One Clutch.co company as a search found it."
  type ClutchCompany {
    "Clutch's id, or the profile URL."
    key: String!
    name: String!
    profileUrl: String!
    website: String!
    logoUrl: String!
    tagline: String!
    description: String!
    rating: Float
    reviewCount: Int
    verification: String!
    hourlyRate: String!
    minProjectSize: String!
    employees: String!
    founded: String!
    headquarters: String!
    locations: [String!]!
    phone: String!
    emails: [String!]!
    services: [String!]!
    people: [ClutchPerson!]!
    reviews: [ClutchReview!]!
    portfolio: [ClutchPortfolioItem!]!
  }

  "One Clutch search and what it found (CRM > Lead generators > Clutch)."
  type ClutchRun {
    id: ID!
    engine: ClutchEngine!
    status: ClutchRunStatus!
    keyword: String!
    location: String!
    industry: String!
    profileUrls: [String!]!
    includeDetails: Boolean!
    includeReviews: Boolean!
    includePortfolio: Boolean!
    maxItems: Int!
    companies: [ClutchCompany!]!
    companyCount: Int!
    "Keys of the companies already filed into the CRM."
    filedKeys: [String!]!
    error: String!
    notes: [String!]!
    startedByName: String!
    createdAt: DateTime!
    finishedAt: DateTime
  }

  type ClutchRunPage {
    rows: [ClutchRun!]!
    totalCount: Int!
  }

  "The company's Apify account for lead generators. The token itself is never returned."
  type LeadSourceSettings {
    hasApifyToken: Boolean!
    apifyTokenHint: String!
    "e.g. scrapeai/clutch-co-scraper."
    clutchActorId: String!
    updatedByName: String!
  }

  input ClutchSearchInput {
    engine: ClutchEngine!
    "What to search for, e.g. Web Development or 'api development'."
    keyword: String!
    location: String!
    industry: String!
    "Clutch profile links to read in full (https://clutch.co/profile/…)."
    profileUrls: [String!]!
    includeDetails: Boolean!
    includeReviews: Boolean!
    includePortfolio: Boolean!
    "1 to 200."
    maxItems: Int!
  }

  input LeadSourceSettingsInput {
    "Blank keeps the stored token."
    apifyToken: String!
    clutchActorId: String!
  }

  type ClutchImportSkip {
    key: String!
    name: String!
    reason: String!
    companyId: ID
  }

  type ClutchImportFiled {
    key: String!
    companyId: ID!
  }

  type ClutchImportResult {
    created: Int!
    skipped: Int!
    "People with an email, filed as contacts of their company."
    contactsCreated: Int!
    skips: [ClutchImportSkip!]!
    filed: [ClutchImportFiled!]!
  }

  extend type Query {
    "One Clutch search with everything it found."
    clutchRun(id: ID!): ClutchRun!
    "Every Clutch search, newest first."
    clutchRunsPaged(input: TableQueryInput!): ClutchRunPage!
    "The Apify settings. Named Config so the CRM MCP never offers it to Claude."
    leadSourceConfig: LeadSourceSettings!
  }

  extend type Mutation {
    "Starts a Clutch search; it finishes in the background (poll clutchRun)."
    startClutchSearch(input: ClutchSearchInput!): ClutchRun!
    deleteClutchRun(id: ID!): Boolean!
    "Files the chosen companies of a search as CRM companies, and their listed people as contacts."
    importClutchCompanies(runId: ID!, keys: [String!]!): ClutchImportResult!
    saveLeadSourceConfig(input: LeadSourceSettingsInput!): LeadSourceSettings!
    "Removes the Apify token: Clutch searches use Clutch's own server."
    clearApifyToken: LeadSourceSettings!
  }
`;

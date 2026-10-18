import gql from 'graphql-tag';

/** Firecrawl (Tech) and the CRM's website scraper built on it (see this module). */
export const webScraperTypeDefs = gql`
  "The install's Firecrawl account (Tech > Environment Variables). The API key is write-only, and a self-hosted Firecrawl may have none."
  type FirecrawlConfig {
    id: ID!
    label: String!
    baseUrl: String!
    hasApiKey: Boolean!
    apiKeyHint: String
    isActive: Boolean!
    updatedAt: DateTime!
  }

  input FirecrawlConfigInput {
    label: String!
    "https://api.firecrawl.dev, or the http(s) address of a self-hosted Firecrawl."
    baseUrl: String!
    "Required for the hosted API at api.firecrawl.dev; empty for a self-hosted Firecrawl without authentication. Leave empty when editing to keep it."
    apiKey: String!
    isActive: Boolean
  }

  "A web page read through Firecrawl, kept as markdown, with the last AI answer about it."
  type WebScrape {
    id: ID!
    url: String!
    title: String!
    markdown: String!
    "The page's full length; only the first 200,000 characters are kept."
    charCount: Int!
    createdByName: String!
    aiInstruction: String!
    aiResponse: String!
    aiCostUsd: Float
    analyzedAt: DateTime
    createdAt: DateTime!
  }

  type WebScrapePage {
    rows: [WebScrape!]!
    totalCount: Int!
  }

  "What handing a scraped page to the AI would cost, worked out before anything is spent."
  type WebScrapeAiEstimate {
    model: String!
    "The prompt: the instruction plus the page, at about four characters a token."
    inputTokens: Int!
    "A page-long answer, assumed for the estimate."
    outputTokens: Int!
    costUsd: Float!
    "False when the model has no price in Tech > AI Pricing; the cost then reads 0."
    priced: Boolean!
    "True when the page is longer than the AI reads (60,000 characters) and was cut."
    truncated: Boolean!
  }

  extend type Query {
    firecrawlConfigs: [FirecrawlConfig!]!
    "Whether the website scraper can run: an active Firecrawl config with a key, or a self-hosted one that needs none."
    firecrawlReady: Boolean!
    listWebScrapesPaged(input: TableQueryInput!): WebScrapePage!
    getWebScrape(id: ID!): WebScrape!
    webScrapeAiEstimate(id: ID!, instruction: String!): WebScrapeAiEstimate!
  }

  extend type Mutation {
    createFirecrawlConfig(input: FirecrawlConfigInput!): FirecrawlConfig!
    updateFirecrawlConfig(id: ID!, input: FirecrawlConfigInput!): FirecrawlConfig!
    "Scrapes example.com with this config; says what worked, or why not."
    testFirecrawlConfig(id: ID!): String!
    deleteFirecrawlConfig(id: ID!): Boolean!
    "Reads one public web page through Firecrawl and keeps it as markdown."
    scrapeWebsite(url: String!): WebScrape!
    deleteWebScrape(id: ID!): Boolean!
    "Sends a scraped page and an instruction to the AI; spends AI budget."
    analyzeWebScrape(id: ID!, instruction: String!): WebScrape!
  }
`;

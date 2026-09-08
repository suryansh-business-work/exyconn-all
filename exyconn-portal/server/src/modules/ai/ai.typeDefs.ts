import gql from 'graphql-tag';

export const aiTypeDefs = gql`
  enum AiJobStatus {
    QUEUED
    RUNNING
    SUCCEEDED
    FAILED
  }

  "One prompt sent to OpenAI, with the answer and the tokens it cost."
  type AiJob {
    id: ID!
    name: String!
    model: String!
    prompt: String!
    status: AiJobStatus!
    "The prompt-library entry this job was started from, when it was."
    promptId: String!
    response: String!
    "Why the run failed, in the words the API gave. Empty unless the status is FAILED."
    error: String!
    promptTokens: Int!
    completionTokens: Int!
    totalTokens: Int!
    "What the run cost at the model's price. Zero when the model has no price on file."
    costUsd: Float!
    latencyMs: Int!
    "When the job was handed to the worker. Null on a job nobody has run yet."
    queuedAt: DateTime
    ranAt: DateTime
    "Who started it, from their token — never supplied by the client."
    createdById: String!
    createdByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "A job is always created QUEUED — only running it moves the status on."
  input AiJobInput {
    name: String!
    model: String!
    prompt: String!
  }

  "The model picker's options and the value it should open on."
  type AiModelOptions {
    models: [String!]!
    defaultModel: String!
  }

  enum PromptCategory {
    WRITING
    CODING
    MARKETING
    SUPPORT
    ANALYSIS
    GENERAL
  }

  type Prompt {
    id: ID!
    title: String!
    category: PromptCategory!
    content: String!
    description: String
    tags: [String!]!
    "The {{name}} placeholders in the content, derived on every save."
    variables: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "One value filled into a prompt's {{name}} placeholder."
  input PromptVariableInput {
    name: String!
    value: String!
  }

  "How much, and in what shape, a summary comes back."
  enum SummaryStyle {
    BRIEF
    BULLETS
    DETAILED
  }

  "The documents the shared assist button can draft."
  enum AiDraftKind {
    JOB_DESCRIPTION
    EMAIL_REPLY
    RELEASE_NOTE
    MEETING_NOTES
  }

  "What one model costs, in US dollars per 1,000 tokens."
  type AiModelPrice {
    id: ID!
    model: String!
    inputPer1kUsd: Float!
    outputPer1kUsd: Float!
    active: Boolean!
    updatedAt: DateTime!
  }

  input AiModelPriceInput {
    model: String!
    inputPer1kUsd: Float!
    outputPer1kUsd: Float!
    active: Boolean!
  }

  "The budget every run is checked against. A cap of zero means no cap on that axis."
  type AiSpendLimit {
    monthlyUsdCap: Float!
    perUserDailyUsdCap: Float!
    enabled: Boolean!
  }

  input AiSpendLimitInput {
    monthlyUsdCap: Float!
    perUserDailyUsdCap: Float!
    enabled: Boolean!
  }

  type AiUserSpend {
    userId: String!
    name: String!
    usd: Float!
    jobs: Int!
  }

  type AiModelSpend {
    model: String!
    usd: Float!
    jobs: Int!
  }

  "What AI cost over a window, and who and what it went on."
  type AiSpendSummary {
    totalUsd: Float!
    byUser: [AiUserSpend!]!
    byModel: [AiModelSpend!]!
  }

  input PromptInput {
    title: String!
    category: PromptCategory!
    content: String!
    description: String
    tags: [String!]
  }

  type AiJobPage {
    rows: [AiJob!]!
    totalCount: Int!
  }

  type PromptPage {
    rows: [Prompt!]!
    totalCount: Int!
  }

  extend type Query {
    listAiJobs: [AiJob!]!
    listAiJobsPaged(input: TableQueryInput!): AiJobPage!
    listAiJobsStats: TableStats!
    getAiJob(id: ID!): AiJob!
    "Read live from OpenAI with the active key, so the list is what the account can reach."
    aiModels: AiModelOptions!
    "What AI cost between two instants, broken down by person and by model."
    aiSpendSummary(from: DateTime!, to: DateTime!): AiSpendSummary!
    aiSpendLimit: AiSpendLimit!
    listAiModelPrices: [AiModelPrice!]!
    listPrompts: [Prompt!]!
    listPromptsPaged(input: TableQueryInput!): PromptPage!
    listPromptsStats: TableStats!
    getPrompt(id: ID!): Prompt!
  }

  extend type Mutation {
    createAiJob(input: AiJobInput!): AiJob!
    updateAiJob(id: ID!, input: AiJobInput!): AiJob!
    deleteAiJob(id: ID!): Boolean!
    "Queues the job for the AI worker and answers at once. Poll the job for the result."
    runAiJob(id: ID!): AiJob!
    "Queues a prompt-library entry as a new job, with its {{variables}} filled in."
    runPrompt(id: ID!, model: String!, variables: [PromptVariableInput!]): AiJob!
    "Condenses text the caller already has. Creates an AI job, so the run is on the record."
    aiSummarise(text: String!, style: SummaryStyle = BRIEF): String!
    "Writes a first draft from the caller's context. Creates an AI job, like every run."
    aiDraft(kind: AiDraftKind!, context: String!): String!
    saveAiModelPrice(input: AiModelPriceInput!): AiModelPrice!
    deleteAiModelPrice(id: ID!): Boolean!
    saveAiSpendLimit(input: AiSpendLimitInput!): AiSpendLimit!
    createPrompt(input: PromptInput!): Prompt!
    updatePrompt(id: ID!, input: PromptInput!): Prompt!
    deletePrompt(id: ID!): Boolean!
  }
`;

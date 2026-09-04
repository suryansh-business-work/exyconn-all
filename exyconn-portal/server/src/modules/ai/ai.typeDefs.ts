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
    latencyMs: Int!
    ranAt: DateTime
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
    createdAt: DateTime!
    updatedAt: DateTime!
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
    listPrompts: [Prompt!]!
    listPromptsPaged(input: TableQueryInput!): PromptPage!
    listPromptsStats: TableStats!
    getPrompt(id: ID!): Prompt!
  }

  extend type Mutation {
    createAiJob(input: AiJobInput!): AiJob!
    updateAiJob(id: ID!, input: AiJobInput!): AiJob!
    deleteAiJob(id: ID!): Boolean!
    "Sends the job's prompt to OpenAI and stores the answer, the tokens and the timing."
    runAiJob(id: ID!): AiJob!
    "Runs a prompt-library entry as a new job, so the run keeps its own history."
    runPrompt(id: ID!, model: String!): AiJob!
    createPrompt(input: PromptInput!): Prompt!
    updatePrompt(id: ID!, input: PromptInput!): Prompt!
    deletePrompt(id: ID!): Boolean!
  }
`;

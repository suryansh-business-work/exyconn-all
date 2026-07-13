import gql from 'graphql-tag';

export const aiTypeDefs = gql`
  enum AiJobStatus {
    QUEUED
    RUNNING
    SUCCEEDED
    FAILED
  }

  type AiJob {
    id: ID!
    name: String!
    model: String!
    prompt: String!
    status: AiJobStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input AiJobInput {
    name: String!
    model: String!
    prompt: String!
    status: AiJobStatus!
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

  extend type Query {
    listAiJobs: [AiJob!]!
    getAiJob(id: ID!): AiJob!
    listPrompts: [Prompt!]!
    getPrompt(id: ID!): Prompt!
  }

  extend type Mutation {
    createAiJob(input: AiJobInput!): AiJob!
    updateAiJob(id: ID!, input: AiJobInput!): AiJob!
    deleteAiJob(id: ID!): Boolean!
    createPrompt(input: PromptInput!): Prompt!
    updatePrompt(id: ID!, input: PromptInput!): Prompt!
    deletePrompt(id: ID!): Boolean!
  }
`;

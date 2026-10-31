import gql from 'graphql-tag';

/** `seo` is a free-form JSON block (it carries an arbitrary `jsonLd` payload). */
export const toolTypeDefs = gql`
  type ToolCategory {
    id: ID!
    slug: String!
    category: String!
    description: String!
    icon: String!
    color: String!
    seo: JSON!
    isActive: Boolean!
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ToolCategoryInput {
    slug: String!
    category: String!
    description: String
    icon: String
    color: String
    seo: JSON
    isActive: Boolean
    order: Int
  }

  type ToolPricing {
    price: Float!
    currency: String!
    features: [String!]!
    alterationNote: String!
  }

  input ToolPricingInput {
    price: Float!
    currency: String!
    features: [String!]
    alterationNote: String
  }

  type Tool {
    id: ID!
    toolCode: String!
    categorySlug: String!
    name: String!
    description: String!
    longDescription: String!
    url: String!
    icon: String!
    color: String!
    features: [String!]!
    useCases: [String!]!
    keywords: [String!]!
    pricing: ToolPricing
    seo: JSON!
    isActive: Boolean!
    isMVP: Boolean!
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ToolInput {
    toolCode: String!
    categorySlug: String!
    name: String!
    description: String
    longDescription: String
    url: String
    icon: String
    color: String
    features: [String!]
    useCases: [String!]
    keywords: [String!]
    pricing: ToolPricingInput
    seo: JSON
    isActive: Boolean
    isMVP: Boolean
    order: Int
  }

  type ToolPage {
    rows: [Tool!]!
    totalCount: Int!
  }

  extend type Query {
    listToolCategories: [ToolCategory!]!
    getToolCategory(id: ID!): ToolCategory!
    listTools: [Tool!]!
    listToolsPaged(input: TableQueryInput!): ToolPage!
    listToolsStats: TableStats!
    getTool(id: ID!): Tool!
    "Public: lists the active website tool categories in their display order."
    publicToolCategories: [ToolCategory!]!
    "Public: lists the active website tools in their display order."
    publicTools(
      "Only tools in this category; every category when left out."
      categorySlug: String
    ): [Tool!]!
    "Public: reads one active website tool by its code; null when there is none."
    publicTool("The tool's public code." toolCode: String!): Tool
  }

  extend type Mutation {
    createToolCategory(input: ToolCategoryInput!): ToolCategory!
    updateToolCategory(id: ID!, input: ToolCategoryInput!): ToolCategory!
    deleteToolCategory(id: ID!): Boolean!
    createTool(input: ToolInput!): Tool!
    updateTool(id: ID!, input: ToolInput!): Tool!
    deleteTool(id: ID!): Boolean!
  }
`;

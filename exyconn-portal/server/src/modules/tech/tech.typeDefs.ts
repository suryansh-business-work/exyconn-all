import gql from 'graphql-tag';

export const techTypeDefs = gql`
  type EmailConfig {
    id: ID!
    label: String!
    host: String!
    port: Int!
    secure: Boolean!
    username: String!
    password: String!
    fromAddress: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ImageConfig {
    id: ID!
    label: String!
    provider: String!
    publicKey: String!
    privateKey: String!
    urlEndpoint: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input EmailConfigInput {
    label: String!
    host: String!
    port: Int!
    secure: Boolean!
    username: String!
    password: String!
    fromAddress: String!
    isActive: Boolean
  }

  input ImageConfigInput {
    label: String!
    provider: String
    publicKey: String!
    privateKey: String!
    urlEndpoint: String!
    isActive: Boolean
  }

  extend type Query {
    listEmailConfigs: [EmailConfig!]!
    listImageConfigs: [ImageConfig!]!
  }

  extend type Mutation {
    createEmailConfig(input: EmailConfigInput!): EmailConfig!
    updateEmailConfig(id: ID!, input: EmailConfigInput!): EmailConfig!
    deleteEmailConfig(id: ID!): Boolean!
    createImageConfig(input: ImageConfigInput!): ImageConfig!
    updateImageConfig(id: ID!, input: ImageConfigInput!): ImageConfig!
    deleteImageConfig(id: ID!): Boolean!
    sendTestEmail(id: ID!, to: String!): Boolean!
    testImageUpload(id: ID!, file: String!, fileName: String!): String!
  }
`;

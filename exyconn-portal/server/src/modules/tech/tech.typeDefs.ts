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

  type SlackConfig {
    id: ID!
    label: String!
    botToken: String!
    defaultChannel: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type GithubConfig {
    id: ID!
    label: String!
    owner: String!
    repo: String!
    token: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SlackChannel {
    id: String!
    name: String!
    isPrivate: Boolean!
    isMember: Boolean!
  }

  "One run of the tracker build workflow."
  type TrackerBuild {
    id: String!
    "queued, in_progress or completed."
    status: String!
    "success, failure, cancelled — null until the run completes."
    conclusion: String
    branch: String!
    url: String!
    startedAt: DateTime!
  }

  type TrackerBuildSettings {
    slackChannels: [String!]!
  }

  "The installers a build can produce."
  enum TrackerPlatform {
    WINDOWS
    MACOS
    LINUX
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

  input SlackConfigInput {
    label: String!
    botToken: String!
    defaultChannel: String!
    isActive: Boolean
  }

  input GithubConfigInput {
    label: String!
    owner: String!
    repo: String!
    token: String!
    isActive: Boolean
  }

  extend type Query {
    listEmailConfigs: [EmailConfig!]!
    listImageConfigs: [ImageConfig!]!
    listSlackConfigs: [SlackConfig!]!
    listGithubConfigs: [GithubConfig!]!
    "Every channel the active Slack bot token can see."
    listSlackChannels: [SlackChannel!]!
    listTrackerBuilds: [TrackerBuild!]!
    trackerBuildSettings: TrackerBuildSettings!
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
    createSlackConfig(input: SlackConfigInput!): SlackConfig!
    updateSlackConfig(id: ID!, input: SlackConfigInput!): SlackConfig!
    deleteSlackConfig(id: ID!): Boolean!
    sendTestSlackMessage(id: ID!, channel: String!): Boolean!
    createGithubConfig(input: GithubConfigInput!): GithubConfig!
    updateGithubConfig(id: ID!, input: GithubConfigInput!): GithubConfig!
    deleteGithubConfig(id: ID!): Boolean!
    testGithubConnection(id: ID!): Boolean!
    "Asks GitHub to build the chosen installers off the given branch."
    startTrackerBuild(platforms: [TrackerPlatform!]!, ref: String!): Boolean!
    saveTrackerBuildSettings(slackChannels: [String!]!): TrackerBuildSettings!
  }
`;

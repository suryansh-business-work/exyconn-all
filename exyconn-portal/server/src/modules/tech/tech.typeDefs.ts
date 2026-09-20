import gql from 'graphql-tag';

export const techTypeDefs = gql`
  type EmailConfig {
    id: ID!
    label: String!
    host: String!
    port: Int!
    secure: Boolean!
    username: String!
    "Whether a password is stored. The password itself is write-only and never returned."
    hasPassword: Boolean!
    fromAddress: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "The mailbox the support desk reads. The password is write-only and never returned."
  type InboundMailConfig {
    id: ID!
    label: String!
    host: String!
    port: Int!
    secure: Boolean!
    user: String!
    mailbox: String!
    "How long the poller waits between rounds."
    pollSeconds: Int!
    "Whether an imported message is removed from the mailbox rather than only marked seen."
    deleteAfterImport: Boolean!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ImageConfig {
    id: ID!
    label: String!
    provider: String!
    publicKey: String!
    "Whether a private key is stored. The key itself is write-only and never returned."
    hasPrivateKey: Boolean!
    "The key's last four characters, to tell two apart; null when too short to show safely."
    privateKeyHint: String
    urlEndpoint: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SlackConfig {
    id: ID!
    label: String!
    "Whether a bot token is stored. The token itself is write-only and never returned."
    hasBotToken: Boolean!
    "The token's last four characters, to tell two apart; null when too short to show safely."
    botTokenHint: String
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
    "Whether an access token is stored. The token itself is write-only and never returned."
    hasToken: Boolean!
    "The token's last four characters, to tell two apart; null when too short to show safely."
    tokenHint: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "The Pexels API credential behind the shared upload dialog's stock tabs."
  type PexelsConfig {
    id: ID!
    label: String!
    "Whether an API key is stored. The key itself is write-only and never returned."
    hasApiKey: Boolean!
    "The key's last four characters, to tell two apart; null when too short to show safely."
    apiKeyHint: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "The OpenAI credential the platform's AI features run on."
  type OpenAiConfig {
    id: ID!
    label: String!
    "Whether an API key is stored. The key itself is write-only and never returned."
    hasApiKey: Boolean!
    "The key's last four characters, to tell two apart; null when too short to show safely."
    apiKeyHint: String
    "The model requests default to, e.g. gpt-4o-mini."
    defaultModel: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "One Pexels result — a photo or a video — flattened to what the upload dialog renders."
  type PexelsMedia {
    id: String!
    "Still frame for the grid: the photo thumbnail, or the video's poster."
    previewUrl: String!
    "The URL stored when the item is picked."
    url: String!
    alt: String!
    "Photographer / videographer, credited under the grid as Pexels requires."
    credit: String!
    "Seconds. Zero for photos."
    duration: Int!
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
    "Where a status incident opening or resolving is announced."
    statusAlertChannels: [String!]!
  }

  "The installers a build can produce."
  enum TrackerPlatform {
    WINDOWS
    MACOS
    LINUX
    "An APK to install directly, plus an AAB for the Play Store."
    ANDROID
    "An unsigned IPA, installable only once re-signed."
    IOS
  }

  input EmailConfigInput {
    label: String!
    host: String!
    port: Int!
    secure: Boolean!
    username: String!
    "Write-only. Leave empty when editing to keep the stored password."
    password: String!
    fromAddress: String!
    isActive: Boolean
  }

  input InboundMailConfigInput {
    label: String!
    host: String!
    port: Int!
    secure: Boolean!
    user: String!
    "Write-only. Leave empty when editing to keep the stored password."
    password: String!
    mailbox: String!
    pollSeconds: Int!
    deleteAfterImport: Boolean!
    isActive: Boolean
  }

  input ImageConfigInput {
    label: String!
    provider: String
    publicKey: String!
    "Write-only. Leave empty when editing to keep the stored key."
    privateKey: String!
    urlEndpoint: String!
    isActive: Boolean
  }

  input SlackConfigInput {
    label: String!
    "Write-only. Leave empty when editing to keep the stored token."
    botToken: String!
    defaultChannel: String!
    isActive: Boolean
  }

  """
  The Pexels search filters the upload dialog exposes. Colour is photo-only; the duration
  bounds (in seconds) are video-only. An omitted field means "any".
  """
  input PexelsSearchFilters {
    "landscape | portrait | square"
    orientation: String
    "large | medium | small"
    size: String
    "A Pexels colour name, or a #rrggbb value. Photos only."
    color: String
    "Videos only, in seconds."
    minDuration: Int
    maxDuration: Int
  }

  input PexelsConfigInput {
    label: String!
    "Write-only. Leave empty when editing to keep the stored key."
    apiKey: String!
    isActive: Boolean
  }

  input OpenAiConfigInput {
    label: String!
    "Write-only. Leave empty when editing to keep the stored key."
    apiKey: String!
    defaultModel: String!
    isActive: Boolean
  }

  input GithubConfigInput {
    label: String!
    owner: String!
    repo: String!
    "Write-only. Leave empty when editing to keep the stored token."
    token: String!
    isActive: Boolean
  }

  "One background loop the server runs, and what its last pass reported."
  type BackgroundJob {
    key: String!
    label: String!
    "What it does, for somebody deciding whether to run it now."
    description: String!
    "Null until it has run once in this process — a restart forgets, deliberately."
    lastRunAt: DateTime
    lastRunSummary: String!
  }

  extend type Query {
    "TECH: every background loop, with what its last pass did."
    backgroundJobs: [BackgroundJob!]!
    listEmailConfigs: [EmailConfig!]!
    listInboundMailConfigs: [InboundMailConfig!]!
    listImageConfigs: [ImageConfig!]!
    listSlackConfigs: [SlackConfig!]!
    listGithubConfigs: [GithubConfig!]!
    listPexelsConfigs: [PexelsConfig!]!
    listOpenAiConfigs: [OpenAiConfig!]!
    "Stock photos for the shared upload dialog. Any signed-in user may search."
    searchPexelsPhotos(query: String!, page: Int, filters: PexelsSearchFilters): [PexelsMedia!]!
    "Stock videos for the shared upload dialog. Any signed-in user may search."
    searchPexelsVideos(query: String!, page: Int, filters: PexelsSearchFilters): [PexelsMedia!]!
    "Every channel the active Slack bot token can see."
    listSlackChannels: [SlackChannel!]!
    listTrackerBuilds: [TrackerBuild!]!
    trackerBuildSettings: TrackerBuildSettings!
  }

  extend type Mutation {
    """
    TECH: takes one pass of a loop now, across every company.

    Safe to press twice: every loop is idempotent by construction, because two processes may
    tick at the same moment anyway. This is the same pass the timer takes, not a second
    implementation of it.
    """
    runBackgroundJob(key: String!): Boolean!
    createEmailConfig(input: EmailConfigInput!): EmailConfig!
    updateEmailConfig(id: ID!, input: EmailConfigInput!): EmailConfig!
    deleteEmailConfig(id: ID!): Boolean!
    createInboundMailConfig(input: InboundMailConfigInput!): InboundMailConfig!
    updateInboundMailConfig(id: ID!, input: InboundMailConfigInput!): InboundMailConfig!
    deleteInboundMailConfig(id: ID!): Boolean!
    "Signs in and opens the mailbox, so credentials are checked before the poller relies on them."
    testInboundMailConnection(id: ID!): Boolean!
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
    createPexelsConfig(input: PexelsConfigInput!): PexelsConfig!
    updatePexelsConfig(id: ID!, input: PexelsConfigInput!): PexelsConfig!
    deletePexelsConfig(id: ID!): Boolean!
    testPexelsConnection(id: ID!): Boolean!
    createOpenAiConfig(input: OpenAiConfigInput!): OpenAiConfig!
    updateOpenAiConfig(id: ID!, input: OpenAiConfigInput!): OpenAiConfig!
    deleteOpenAiConfig(id: ID!): Boolean!
    testOpenAiConnection(id: ID!): Boolean!
    "Asks GitHub to build the chosen installers off the given branch."
    startTrackerBuild(platforms: [TrackerPlatform!]!, ref: String!): Boolean!
    saveTrackerBuildSettings(
      slackChannels: [String!]!
      statusAlertChannels: [String!]
    ): TrackerBuildSettings!
  }
`;

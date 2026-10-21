import gql from 'graphql-tag';

/** Getting extension builds out to people: approve, build, and where releases are announced. */
export const maReleaseTypeDefs = gql`
  "What the extension page needs to explain why there is nothing to download yet."
  type MaReleaseOverview {
    "Whether the caller manages extension releases."
    releaseManager: Boolean!
    "Builds uploaded to the portal (0 for anyone but a release manager)."
    registered: Int!
    "Builds waiting for a release manager's approval (0 for anyone but a release manager)."
    awaitingApproval: Int!
  }

  "How builds reach the portal and where they are announced. Install-wide."
  type MaReleaseSettings {
    "The owner/repo whose release workflow may upload builds (GitHub Actions OIDC, main only)."
    allowedRepository: String!
    "The Slack channel published builds are announced in; empty for none."
    slackChannelId: String!
    slackChannelName: String!
    "Also post when a new build arrives for QA."
    notifyOnNewBuild: Boolean!
    "Whether Tech has an active Slack config."
    slackConfigured: Boolean!
    updatedByName: String!
    updatedAt: DateTime
  }

  input MaReleaseSettingsInput {
    allowedRepository: String!
    slackChannelId: String!
    notifyOnNewBuild: Boolean!
  }

  extend type Query {
    maReleaseOverview: MaReleaseOverview!
    maReleaseSettings: MaReleaseSettings!
    "The Slack channels a release announcement can go to."
    maReleaseSlackChannels: [SlackChannel!]!
  }

  extend type Mutation {
    "Approves a build waiting for review, offers it on the channel and announces it in Slack."
    maApproveRelease(id: ID!, channel: MaReleaseChannel!): MaRelease!
    "Starts the extension build workflow; the run uploads the build here for approval."
    maStartExtensionBuild(channel: MaReleaseChannel!): Boolean!
    maUpdateReleaseSettings(input: MaReleaseSettingsInput!): MaReleaseSettings!
  }
`;

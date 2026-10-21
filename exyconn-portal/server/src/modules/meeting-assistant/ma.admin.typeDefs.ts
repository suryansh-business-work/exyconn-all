import gql from 'graphql-tag';

/** Settings, the extension's sign-in, Google Meet connection and extension releases. */
export const maAdminTypeDefs = gql`
  enum MaReleaseChannel {
    STABLE
    BETA
    INTERNAL
  }

  enum MaReleaseStatus {
    DRAFT
    BUILDING
    BUILD_FAILED
    QA_PENDING
    READY_FOR_INTERNAL_TESTING
    INTERNAL_RELEASED
    READY_FOR_STORE_SUBMISSION
    SUBMITTED_FOR_REVIEW
    IN_REVIEW
    PUBLISHED
    REJECTED
    DEPRECATED
  }

  type MaSettings {
    enabled: Boolean!
    saveRecordings: Boolean!
    audioRetentionDays: Int!
    allowedUserIds: [String!]!
    remindersEnabled: Boolean!
    reminderIntervalMinutes: Int!
    maxRemindersPerMeeting: Int!
    preferredLanguage: MaLanguage!
    summaryStyle: MaSummaryStyle!
    transcriptRetentionDays: Int!
    autoGenerateSummary: Boolean!
    autoEmail: Boolean!
    emailRequiresApproval: Boolean!
    defaultRecipients: [String!]!
    emailParticipants: Boolean!
    emailAllowedDomains: [String!]!
    analysisModel: String!
    transcriptionModel: String!
    diarization: Boolean!
    monthlyBudgetUsd: Float!
    maxMeetingMinutes: Int!
    participantTracking: Boolean!
    liveTranscript: Boolean!
    releaseChannel: MaReleaseChannel!
    "AI spend on meetings so far this calendar month."
    monthSpendUsd: Float!
    updatedByName: String!
    updatedAt: DateTime
  }

  input MaSettingsInput {
    enabled: Boolean!
    saveRecordings: Boolean!
    audioRetentionDays: Int!
    allowedUserIds: [String!]!
    remindersEnabled: Boolean!
    reminderIntervalMinutes: Int!
    maxRemindersPerMeeting: Int!
    preferredLanguage: MaLanguage!
    summaryStyle: MaSummaryStyle!
    transcriptRetentionDays: Int!
    autoGenerateSummary: Boolean!
    autoEmail: Boolean!
    emailRequiresApproval: Boolean!
    defaultRecipients: [String!]!
    emailParticipants: Boolean!
    emailAllowedDomains: [String!]!
    analysisModel: String!
    transcriptionModel: String!
    diarization: Boolean!
    monthlyBudgetUsd: Float!
    maxMeetingMinutes: Int!
    participantTracking: Boolean!
    liveTranscript: Boolean!
    releaseChannel: MaReleaseChannel!
  }

  "What the signed-in extension needs to start: who it is, and the company's switches."
  type MaExtensionContext {
    userId: String!
    name: String!
    email: String!
    organizationName: String!
    enabled: Boolean!
    remindersEnabled: Boolean!
    reminderIntervalMinutes: Int!
    maxRemindersPerMeeting: Int!
    preferredLanguage: MaLanguage!
    participantTracking: Boolean!
    liveTranscript: Boolean!
    maxMeetingMinutes: Int!
    googleConnected: Boolean!
    portalUrl: String!
  }

  "One signed-in copy of the extension."
  type MaExtensionSession {
    id: ID!
    deviceLabel: String!
    extensionVersion: String!
    userAgent: String!
    createdAt: DateTime!
    lastSeenAt: DateTime
    expiresAt: DateTime!
    revokedAt: DateTime
    current: Boolean!
  }

  input MaAuthorizeExtensionInput {
    extensionId: String!
    redirectUri: String!
    codeChallenge: String!
    codeChallengeMethod: String!
    state: String!
  }

  type MaGoogleConnection {
    configured: Boolean!
    connected: Boolean!
    email: String
    connectedAt: DateTime
    lastError: String!
  }

  type MaReleaseEvent {
    status: MaReleaseStatus!
    at: DateTime!
    byName: String!
    note: String!
  }

  "One build of the Chrome extension. Never exposes where the artifact is stored."
  type MaRelease {
    id: ID!
    version: String!
    channel: MaReleaseChannel!
    buildNumber: Int!
    commitSha: String!
    builtAt: DateTime!
    artifactName: String!
    artifactSize: Int!
    sha256: String!
    releaseNotes: String!
    minChromeVersion: String!
    status: MaReleaseStatus!
    storeItemId: String!
    storeUrl: String!
    buildRunUrl: String!
    publisherName: String!
    downloadCount: Int!
    downloadable: Boolean!
    statusHistory: [MaReleaseEvent!]!
    createdAt: DateTime!
  }

  "A link that downloads one release once it is followed, valid for a few minutes."
  type MaDownloadLink {
    url: String!
    expiresAt: DateTime!
    fileName: String!
    sha256: String!
  }

  input MaReleaseStatusInput {
    status: MaReleaseStatus!
    note: String!
    storeItemId: String
    storeUrl: String
  }

  extend type Query {
    maSettings: MaSettings!
    maExtensionContext: MaExtensionContext!
    maMyExtensionSessions: [MaExtensionSession!]!
    maGoogleConnection: MaGoogleConnection!
    "Releases the caller may see: every one for release managers, approved ones otherwise."
    maReleases: [MaRelease!]!
    "The newest release approved for the caller's company channel."
    maLatestRelease: MaRelease
  }

  extend type Mutation {
    maUpdateSettings(input: MaSettingsInput!): MaSettings!
    "Issues a one-time code for the extension's PKCE sign-in; returns the URL to send the browser to."
    maAuthorizeExtension(input: MaAuthorizeExtensionInput!): String!
    maRevokeExtensionSession(id: ID!): Boolean!
    "Returns Google's consent page for the Meet read-only scope."
    maStartGoogleConnect(returnTo: String!): String!
    maDisconnectGoogle: Boolean!
    "Fetches the official Google Meet transcript and participants again."
    maImportOfficialTranscript(meetingId: ID!): MaMeeting!
    maSetReleaseStatus(id: ID!, input: MaReleaseStatusInput!): MaRelease!
    maReleaseDownloadLink(id: ID!): MaDownloadLink!
  }
`;

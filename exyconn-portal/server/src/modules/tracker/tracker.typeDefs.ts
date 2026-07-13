import gql from 'graphql-tag';

/**
 * Time-tracker schema.
 *
 * `device*` operations are called by the Electron desktop app with a non-expiring device
 * token (guarded by assertTrackerDevice). The rest are portal operations guarded by the
 * TRACKER role, except `myTracker*` which any employee may call for their OWN data.
 */
export const trackerTypeDefs = gql`
  type TrackerSettings {
    id: ID!
    intervalMinutes: Int!
    screenshotsPerInterval: Int!
    randomizeScreenshotTiming: Boolean!
    blurScreenshots: Boolean!
    trackWindowTitles: Boolean!
    idleThresholdSeconds: Int!
    screenshotMaxWidth: Int!
    screenshotQuality: Int!
    autoSyncEnabled: Boolean!
    syncIntervalMinutes: Int!
  }

  input TrackerSettingsInput {
    intervalMinutes: Int
    screenshotsPerInterval: Int
    randomizeScreenshotTiming: Boolean
    blurScreenshots: Boolean
    trackWindowTitles: Boolean
    idleThresholdSeconds: Int
    screenshotMaxWidth: Int
    screenshotQuality: Int
    autoSyncEnabled: Boolean
    syncIntervalMinutes: Int
  }

  type TrackerAccess {
    id: ID!
    userId: ID!
    grantedBy: String!
    grantedAt: DateTime!
    revokedAt: DateTime
    isActive: Boolean!
    consentedAt: DateTime
  }

  type TrackerDevice {
    id: ID!
    userId: ID!
    deviceId: String!
    platform: String!
    hostname: String!
    appVersion: String!
    issuedAt: DateTime!
    lastSeenAt: DateTime!
    revokedAt: DateTime
    isActive: Boolean!
  }

  type TrackerSession {
    id: ID!
    userId: ID!
    deviceId: String!
    startedAt: DateTime!
    endedAt: DateTime
    status: String!
    activeMs: Float!
    idleMs: Float!
    keyCount: Int!
    mouseCount: Int!
  }

  type TrackerInterval {
    id: ID!
    sessionId: ID!
    startedAt: DateTime!
    endedAt: DateTime!
    keyCount: Int!
    mouseCount: Int!
    activeMs: Float!
    idleMs: Float!
    activityPercent: Int!
  }

  type TrackerScreenshot {
    id: ID!
    sessionId: ID!
    intervalStartedAt: DateTime!
    capturedAt: DateTime!
    imageUrl: String!
    displayId: String!
    blurred: Boolean!
  }

  type TrackerAppUsage {
    appName: String!
    durationMs: Float!
  }

  type TrackerDayBucket {
    date: String!
    activeMs: Float!
    idleMs: Float!
    keyCount: Int!
    mouseCount: Int!
    sessions: Int!
  }

  type TrackerDay {
    intervals: [TrackerInterval!]!
    screenshots: [TrackerScreenshot!]!
    sessions: [TrackerSession!]!
    appUsage: [TrackerAppUsage!]!
  }

  # ── Desktop app payloads ──────────────────────────────────────────────
  input TrackerDeviceInput {
    deviceId: String!
    platform: String!
    hostname: String
    appVersion: String
  }

  input TrackerWindowUsageInput {
    appName: String!
    windowTitle: String
    durationMs: Float!
  }

  input TrackerIntervalInput {
    startedAt: DateTime!
    endedAt: DateTime!
    keyCount: Int!
    mouseCount: Int!
    activeMs: Float!
    idleMs: Float!
    windows: [TrackerWindowUsageInput!]
  }

  input TrackerScreenshotInput {
    sessionId: ID!
    intervalStartedAt: DateTime!
    capturedAt: DateTime!
    image: String!
    displayId: String
    blurred: Boolean
  }

  type TrackerLoginPayload {
    token: String!
    user: User!
    consentRequired: Boolean!
    settings: TrackerSettings!
  }

  extend type Query {
    # Portal (TRACKER role)
    trackerSettings: TrackerSettings!
    trackerAccessList: [TrackerAccess!]!
    trackerDevices(userId: ID): [TrackerDevice!]!
    trackerCalendar(userId: ID!, from: DateTime!, to: DateTime!, timezone: String!): [TrackerDayBucket!]!
    trackerDay(userId: ID!, start: DateTime!, end: DateTime!): TrackerDay!

    # Employee self-view (own data only)
    myTrackerAccess: TrackerAccess
    myTrackerCalendar(from: DateTime!, to: DateTime!, timezone: String!): [TrackerDayBucket!]!
    myTrackerDay(start: DateTime!, end: DateTime!): TrackerDay!
  }

  extend type Mutation {
    # Portal (TRACKER role)
    grantTrackerAccess(userId: ID!): TrackerAccess!
    revokeTrackerAccess(userId: ID!): TrackerAccess!
    revokeTrackerDevice(deviceId: String!): TrackerDevice!
    updateTrackerSettings(input: TrackerSettingsInput!): TrackerSettings!

    # Desktop app (device token, except trackerLogin which authenticates)
    trackerLogin(email: String!, password: String!, device: TrackerDeviceInput!): TrackerLoginPayload!
    trackerAcceptConsent: Boolean!
    trackerHeartbeat: Boolean!
    trackerStartSession(startedAt: DateTime!): TrackerSession!
    trackerStopSession(sessionId: ID!, endedAt: DateTime!): TrackerSession!
    trackerSyncIntervals(sessionId: ID!, intervals: [TrackerIntervalInput!]!): Int!
    trackerUploadScreenshot(input: TrackerScreenshotInput!): TrackerScreenshot!
  }
`;

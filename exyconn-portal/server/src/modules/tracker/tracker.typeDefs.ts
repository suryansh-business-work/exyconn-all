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
    """
    0-100. 100 means actual best quality: native resolution, encoded losslessly, no
    downscale. Below 100 is a JPEG at that quality, downscaled to screenshotMaxWidth.
    """
    screenshotQuality: Int!
    """
    Capture a webcam photo with each screenshot and composite it into a corner of the shot.
    """
    webcamEnabled: Boolean!
    """
    One of: top-left, top-right, bottom-left, bottom-right.
    """
    webcamCorner: String!
    syncIntervalMinutes: Int!
    consentText: String!
    """
    House default IANA zone (e.g. "Asia/Kolkata"), chosen by an admin.
    An empty string means "no house default" — fall back to the device's own zone.
    """
    defaultTimezone: String!
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
    webcamEnabled: Boolean
    webcamCorner: String
    syncIntervalMinutes: Int
    consentText: String
    defaultTimezone: String
  }

  type TrackerAccess {
    id: ID!
    userId: ID!
    grantedBy: String!
    grantedAt: DateTime!
    revokedAt: DateTime
    isActive: Boolean!
    consentedAt: DateTime
    """
    The zone THIS employee picked in the desktop app.
    An empty string means they never picked one.
    """
    timezone: String!
  }

  type TrackerDevice {
    id: ID!
    userId: ID!
    deviceId: String!
    platform: String!
    hostname: String!
    appVersion: String!
    machineId: String!
    osName: String!
    osVersion: String!
    arch: String!
    cpuModel: String!
    cpuCores: Int!
    totalMemoryMb: Int!
    locale: String!
    timezone: String!
    screenCount: Int!
    screenResolution: String!
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
    """
    Activity level (0-100) of the interval this screenshot belongs to. 0 when the interval
    it belongs to has not been synced yet — the app uploads shots from inside the interval.
    """
    activityPercent: Int!
  }

  """
  All-time tracker totals for one employee.
  """
  type TrackerTotals {
    """
    Float, not Int: all-time milliseconds overflow a 32-bit Int.
    """
    activeMs: Float!
    idleMs: Float!
    screenshots: Int!
    sessions: Int!
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
    machineId: String
    osName: String
    osVersion: String
    arch: String
    cpuModel: String
    cpuCores: Int
    totalMemoryMb: Int
    locale: String
    timezone: String
    screenCount: Int
    screenResolution: String
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

  # Rehydrates a desktop session from a stored (non-expiring) device token, so a
  # "remembered" app can restore who is signed in without asking for the password again.
  type TrackerMe {
    user: User!
    consentRequired: Boolean!
    settings: TrackerSettings!
    """
    The EFFECTIVE zone: the employee's own pick, else the admin default, else the zone this
    device reported at sign-in, else UTC. Never empty.
    """
    timezone: String!
  }

  """
  One installer file published on a tracker release.
  """
  type TrackerReleaseAsset {
    name: String!
    """
    One of: windows, macos, linux.
    """
    platform: String!
    sizeBytes: Float!
    downloadCount: Int!
    """
    Direct download URL on the public GitHub release.
    """
    url: String!
  }

  """
  The newest published desktop tracker build, with its installers.
  """
  type TrackerRelease {
    version: String!
    tag: String!
    name: String!
    """
    Release notes, as Markdown.
    """
    notes: String!
    url: String!
    publishedAt: DateTime!
    assets: [TrackerReleaseAsset!]!
  }

  extend type Query {
    # Portal (TRACKER role)
    trackerSettings: TrackerSettings!
    trackerAccessList: [TrackerAccess!]!
    trackerDevices(userId: ID): [TrackerDevice!]!
    trackerCalendar(
      userId: ID!
      from: DateTime!
      to: DateTime!
      timezone: String!
    ): [TrackerDayBucket!]!
    trackerDay(userId: ID!, start: DateTime!, end: DateTime!): TrackerDay!
    """
    The latest desktop installers. Any signed-in employee may read it — the files
    themselves live on a public GitHub release. Null until a release exists.
    """
    trackerLatestRelease: TrackerRelease
    trackerTotals(userId: ID!): TrackerTotals!

    # Desktop app (device token) — rehydrates a remembered session
    trackerMe: TrackerMe!
    """
    The calling device's own employee, all-time. Device token, not a portal session.
    """
    myTrackerTotals: TrackerTotals!

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
    trackerLogin(
      email: String!
      password: String!
      device: TrackerDeviceInput!
    ): TrackerLoginPayload!
    trackerAcceptConsent: Boolean!
    """
    Desktop keep-alive, called on a timer for as long as the app is signed in.

    Does three things in one round-trip: records that this device is still online (the
    portal's Devices console reads lastSeenAt), hands back the CURRENT portal state so a
    running app adopts settings, consent and timezone changes without a restart, and fails
    with an auth error the moment the device or the access grant is revoked.
    """
    trackerHeartbeat(device: TrackerDeviceInput): TrackerMe!
    trackerStartSession(startedAt: DateTime!): TrackerSession!
    trackerStopSession(sessionId: ID!, endedAt: DateTime!): TrackerSession!
    trackerSyncIntervals(sessionId: ID!, intervals: [TrackerIntervalInput!]!): Int!
    trackerUploadScreenshot(input: TrackerScreenshotInput!): TrackerScreenshot!
    """
    Sets the CALLER's own timezone. Must be a resolvable IANA zone name.
    """
    trackerSetTimezone(timezone: String!): TrackerAccess!
  }
`;

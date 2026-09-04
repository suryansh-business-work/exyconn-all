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
    Days a screenshot is kept before it is deleted from the portal AND from storage.
    0 keeps them indefinitely, which is the default — a workspace opts in to expiry.
    """
    screenshotRetentionDays: Int!
    """
    Start and stop tracking on a schedule rather than waiting for the employee to press
    start. The consent gate still applies before the first session.
    """
    autoStartEnabled: Boolean!
    "Local hour (0-23) tracking starts, in the EMPLOYEE's own timezone."
    autoStartHour: Int!
    "Local hour (0-23) tracking stops. At or before the start hour means it crosses midnight."
    autoStopHour: Int!
    "Email yesterday's tracked time to everyone holding the TRACKER role."
    dailyDigestEnabled: Boolean!
    "The same summary for the last seven days, sent on a Monday."
    weeklyDigestEnabled: Boolean!
    "Local hour (0-23) the digests go out at, read in the workspace's own timezone."
    digestHour: Int!
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
    Slug of the Legal policy used as the disclosure instead of consentText. Empty means
    no policy is chosen; the app then falls back to the text above.
    """
    consentPolicySlug: String!
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
    screenshotRetentionDays: Int
    autoStartEnabled: Boolean
    autoStartHour: Int
    autoStopHour: Int
    dailyDigestEnabled: Boolean
    weeklyDigestEnabled: Boolean
    digestHour: Int
    webcamEnabled: Boolean
    webcamCorner: String
    syncIntervalMinutes: Int
    consentText: String
    consentPolicySlug: String
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
    "The project this run booked its time against."
    projectId: String!
    "The ticket this run was against; empty when the time was booked to the project only."
    taskId: String!
    taskKey: String!
    taskTitle: String!
    "The project's name as it was when the session opened, so a rename cannot rewrite it."
    projectName: String!
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
    "All-time approved off-computer time, kept apart from the measured total."
    manualMs: Float!
    screenshots: Int!
    sessions: Int!
  }

  """
  Work done away from the computer, claimed by the employee and signed off by a reviewer.

  Deliberately separate from a session: everything in a session was measured, this was
  claimed. Only an APPROVED entry counts towards a calendar, a total or an invoice.
  """
  type TrackerManualEntry {
    id: ID!
    userId: ID!
    "Employee's name, resolved for the review queue. Empty on an employee's own list."
    userName: String!
    projectId: ID!
    "The project's name as it was when the entry was filed."
    projectName: String!
    "The ticket the time was against; empty when it was booked to the project only."
    taskId: ID!
    taskKey: String!
    taskTitle: String!
    startedAt: DateTime!
    endedAt: DateTime!
    durationMs: Float!
    "What the time was for. Always present — unexplained claimed time is not reviewable."
    note: String!
    status: TrackerManualEntryStatus!
    reviewedBy: ID!
    reviewedAt: DateTime
    reviewNote: String!
    createdAt: DateTime!
  }

  enum TrackerManualEntryStatus {
    PENDING
    APPROVED
    REJECTED
  }

  input TrackerManualEntryInput {
    "Omit to book against the house-wide Global Project."
    projectId: ID
    "Optional ticket. Ignored when it does not belong to the project above."
    taskId: ID
    startedAt: DateTime!
    endedAt: DateTime!
    note: String!
  }

  "One ticket the desktop app may book a session against."
  type TrackerTask {
    id: ID!
    "The human handle, e.g. EXY-14."
    key: String!
    title: String!
    "Assigned to the calling employee. The picker leads with these."
    assignedToMe: Boolean!
  }

  """
  One person's time on one ticket within a project.

  Measured time (activeMs/idleMs) and claimed time (manualMs) stay separate here for the
  same reason they do everywhere else in the tracker: one was recorded, the other was
  asserted by a person and approved by another.
  """
  type ProjectTimeLogRow {
    "userId:taskId — the pair this row aggregates."
    id: ID!
    userId: ID!
    userName: String!
    "Empty when the time was booked to the project without picking a ticket."
    taskId: ID!
    taskKey: String!
    taskTitle: String!
    activeMs: Float!
    idleMs: Float!
    "Approved off-computer time claimed against the same ticket."
    manualMs: Float!
    sessions: Int!
    screenshots: Int!
  }

  """
  A project's time log, plus whether THIS viewer may open the screenshots behind it.

  Time is project-management data and any PROJECTS user may read it. A screenshot is a
  picture of somebody's screen, so it stays behind the TRACKER role — the flag lets the
  UI say the images are withheld rather than render an empty gallery.
  """
  type ProjectTimeLog {
    rows: [ProjectTimeLogRow!]!
    totalActiveMs: Float!
    totalManualMs: Float!
    "True only when the caller also holds TRACKER (or ADMIN)."
    canViewScreenshots: Boolean!
  }

  "One tracked run behind a time-log row."
  type ProjectTimeLogSession {
    id: ID!
    userId: ID!
    userName: String!
    taskKey: String!
    taskTitle: String!
    startedAt: DateTime!
    "Null while the session is still running."
    endedAt: DateTime
    activeMs: Float!
    idleMs: Float!
    screenshotCount: Int!
  }

  "A screenshot captured during a session, for the time log's evidence drawer."
  type ProjectTimeLogScreenshot {
    id: ID!
    capturedAt: DateTime!
    imageUrl: String!
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
    "Approved off-computer time on this day. Measured time and claimed time stay apart."
    manualMs: Float!
  }

  type TrackerDay {
    intervals: [TrackerInterval!]!
    screenshots: [TrackerScreenshot!]!
    sessions: [TrackerSession!]!
    appUsage: [TrackerAppUsage!]!
  }

  """
  What an employee is contracted to work: when, from where, and for how long a day. Set on
  the employee record in HR; the tracker measures the day against it.
  """
  type TrackerWorkProfile {
    workingTime: WorkingTime!
    "What OTHER means for this person; empty for the named arrangements."
    workingTimeNote: String!
    workLocation: WorkLocation!
    workLocationNote: String!
    workHoursPerDay: Int!
    "The contracted day in milliseconds — the unit every tracker total is in."
    targetMs: Float!
  }

  "One project time may be booked against."
  type TrackerProject {
    id: ID!
    name: String!
    key: String!
  }

  """
  The employee's CURRENT local day: what they are contracted to work, how much of it they
  have worked, and whether they have marked themselves in.
  """
  type TrackerWorkday {
    "The employee's local calendar date, YYYY-MM-DD."
    date: String!
    targetMs: Float!
    "Active milliseconds recorded today. Idle time is excluded — this is time worked."
    activeMs: Float!
    """
    Approved off-computer milliseconds today. Separate from activeMs because that was
    measured and this was claimed; a client adding them must say which is which.
    """
    manualMs: Float!
    attendanceStatus: AttendanceStatus
    attendanceNote: String
    "Tracking cannot start until this is true."
    attendanceMarked: Boolean!
  }

  """
  The Legal policy the workspace uses as its tracking disclosure, with THIS employee's
  signature state on the version now published. Null when no policy is configured.
  """
  type TrackerConsentPolicy {
    id: ID!
    title: String!
    slug: String!
    summary: String!
    body: String!
    version: Int!
    requiresAcknowledgement: Boolean!
    "True only when this person has signed the version currently published."
    acknowledged: Boolean!
    acknowledgedAt: DateTime
  }

  """
  One employee's tracked time over a range, priced at the rate on their HR salary structure.
  """
  type TrackerBillingRow {
    "The employee's user id — one row per employee, so this is the row's identity."
    id: ID!
    name: String!
    email: String!
    payType: PayType!
    currency: String!
    "Per hour, from the employee's salary structure in HR. Zero when HR has not set one."
    billingRate: Float!
    "Billable time: measured active time plus approved off-computer time."
    activeMs: Float!
    "How much of activeMs was claimed off-computer rather than measured."
    manualMs: Float!
    "activeMs as hours, to two places."
    hours: Float!
    amount: Float!
    "False when no rate is set — the amount is zero because nobody priced the work, not because the work was free."
    rated: Boolean!
  }

  "Tracked time priced for a date range. Employees with no time in the range are omitted."
  type TrackerBilling {
    from: DateTime!
    to: DateTime!
    rows: [TrackerBillingRow!]!
    totalHours: Float!
    totalAmount: Float!
    currency: String!
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
    workProfile: TrackerWorkProfile!
    workday: TrackerWorkday!
    "Projects this employee may book time against, the house-wide one first."
    projects: [TrackerProject!]!
    consentPolicy: TrackerConsentPolicy
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
    "One employee's off-computer entries in a range, any status (TRACKER role)."
    trackerManualEntries(userId: ID!, from: DateTime!, to: DateTime!): [TrackerManualEntry!]!
    "Every off-computer entry waiting on a decision, oldest first (TRACKER role)."
    trackerPendingManualEntries: [TrackerManualEntry!]!

    # Project time log (PROJECTS role; screenshots additionally need TRACKER)
    """
    Who worked on which ticket in this project, and for how long. Readable by the PROJECTS
    role — hours against a ticket are how a project is managed.
    """
    projectTimeLog(projectId: ID!, from: DateTime!, to: DateTime!): ProjectTimeLog!
    """
    The individual runs behind a time-log row. Pass taskId: "" for the rows of time booked
    to the project without a ticket.
    """
    projectTimeLogSessions(
      projectId: ID!
      from: DateTime!
      to: DateTime!
      userId: ID
      taskId: ID
    ): [ProjectTimeLogSession!]!
    """
    Screenshots captured during one session of this project. TRACKER (or ADMIN) only: a
    screenshot is a picture of an employee's screen, not a project metric.
    """
    projectTimeLogScreenshots(projectId: ID!, sessionId: ID!): [ProjectTimeLogScreenshot!]!
    """
    Billing for tracked time over a range. Active time only — idle minutes are time at a
    desk, and the rate comes from the employee's HR salary structure, never from here.
    """
    trackerBilling(from: DateTime!, to: DateTime!): TrackerBilling!

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
    "The caller's own off-computer entries in a range, any status."
    myTrackerManualEntries(from: DateTime!, to: DateTime!): [TrackerManualEntry!]!
    """
    Projects time may be booked against, the house-wide one first. The desktop app gets
    the same list inside trackerMe; this is the portal's way in, for the off-computer
    time form. Any signed-in employee may read it — it is a list of project names.
    """
    trackerProjectOptions: [TrackerProject!]!
    """
    Tickets the CALLER may book time against on a project, their own assigned ones first.
    Used by the desktop picker and by the off-computer time form.
    """
    trackerTaskOptions(projectId: ID!): [TrackerTask!]!
  }

  extend type Mutation {
    # Portal (TRACKER role)
    grantTrackerAccess(userId: ID!): TrackerAccess!
    revokeTrackerAccess(userId: ID!): TrackerAccess!
    revokeTrackerDevice(deviceId: String!): TrackerDevice!
    updateTrackerSettings(input: TrackerSettingsInput!): TrackerSettings!
    """
    Approves or rejects an off-computer claim (TRACKER role). A decision is final — an
    entry that has already been decided is refused rather than flipped, so hours somebody
    has been paid against cannot quietly leave a timesheet.
    """
    reviewTrackerManualEntry(
      id: ID!
      status: TrackerManualEntryStatus!
      reviewNote: String
    ): TrackerManualEntry!

    # Employee self-service
    """
    Claims work done away from the computer. Always lands PENDING; it counts for nothing
    until a reviewer approves it.
    """
    createTrackerManualEntry(input: TrackerManualEntryInput!): TrackerManualEntry!
    "Withdraws one of the caller's OWN entries, and only while it is still pending."
    withdrawTrackerManualEntry(id: ID!): Boolean!

    # Desktop app (device token, except trackerLogin which authenticates)
    trackerLogin(
      email: String!
      password: String!
      device: TrackerDeviceInput!
    ): TrackerLoginPayload!
    """
    Accepts the disclosure. When the workspace has pointed the tracker at a Legal policy,
    signedName is required and the acceptance is also recorded in Legal's versioned
    signature ledger — so one press of "I agree" counts in Legal, HR and the tracker at once.
    """
    trackerAcceptConsent(signedName: String): Boolean!
    "Marks the caller in for their current local day. Tracking cannot start until they have."
    trackerMarkAttendance(status: AttendanceStatus!, note: String): TrackerWorkday!
    """
    Desktop keep-alive, called on a timer for as long as the app is signed in.

    Does three things in one round-trip: records that this device is still online (the
    portal's Devices console reads lastSeenAt), hands back the CURRENT portal state so a
    running app adopts settings, consent and timezone changes without a restart, and fails
    with an auth error the moment the device or the access grant is revoked.
    """
    trackerHeartbeat(device: TrackerDeviceInput): TrackerMe!
    """
    Opens a tracking session. Refused until the employee has accepted the disclosure AND
    marked their attendance for the day. An unknown or missing projectId books the time
    against the house-wide Global Project rather than failing the start.
    """
    trackerStartSession(startedAt: DateTime!, projectId: ID, taskId: ID): TrackerSession!
    trackerStopSession(sessionId: ID!, endedAt: DateTime!): TrackerSession!
    trackerSyncIntervals(sessionId: ID!, intervals: [TrackerIntervalInput!]!): Int!
    trackerUploadScreenshot(input: TrackerScreenshotInput!): TrackerScreenshot!
    """
    Sets the CALLER's own timezone. Must be a resolvable IANA zone name.
    """
    trackerSetTimezone(timezone: String!): TrackerAccess!
  }
`;

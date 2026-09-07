import gql from 'graphql-tag';

export const statusTypeDefs = gql`
  enum StatusState {
    OPERATIONAL
    DEGRADED
    DOWN
    UNKNOWN
  }

  enum StatusCategory {
    WEBSITE
    PORTAL
    API
    TOOL
    DESKTOP_APP
  }

  enum ProblemCategory {
    OUTAGE
    SLOWNESS
    LOGIN
    DATA
    UI
    OTHER
  }

  enum ProblemSeverity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum ProblemStatus {
    NEW
    TRIAGED
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  enum IncidentSource {
    MONITOR
    MANUAL
  }

  enum IncidentImpact {
    MINOR
    MAJOR
    CRITICAL
  }

  enum IncidentUpdateStatus {
    INVESTIGATING
    IDENTIFIED
    MONITORING
    RESOLVED
  }

  "One UTC day of a service's history. A day with checks: 0 was never measured."
  type StatusDayPoint {
    date: String!
    uptimePercent: Float!
    avgResponseMs: Int!
    checks: Int!
    failures: Int!
  }

  type StatusServiceSummary {
    id: ID!
    key: String!
    name: String!
    description: String!
    category: StatusCategory!
    url: String!
    state: StatusState!
    responseMs: Int!
    lastCheckedAt: DateTime
    lastError: String!
    uptimeToday: Float!
    uptime30d: Float!
    days: [StatusDayPoint!]!
  }

  "One entry in an incident's timeline."
  type StatusIncidentUpdate {
    id: ID!
    status: IncidentUpdateStatus!
    body: String!
    authorName: String!
    createdAt: DateTime!
  }

  type StatusIncident {
    id: ID!
    serviceKey: String!
    serviceName: String!
    title: String!
    source: IncidentSource!
    impact: IncidentImpact!
    affectedServiceKeys: [String!]!
    state: StatusState!
    reason: String!
    "Newest first."
    updates: [StatusIncidentUpdate!]!
    startedAt: DateTime!
    resolvedAt: DateTime
    durationMinutes: Int!
  }

  type StatusIncidentPage {
    rows: [StatusIncident!]!
    totalCount: Int!
  }

  "What Tech fills in to open an incident by hand; the body becomes the first update."
  input StatusIncidentInput {
    title: String!
    impact: IncidentImpact!
    affectedServiceKeys: [String!]!
    body: String!
  }

  "A planned window during which the listed services are unavailable."
  type StatusMaintenance {
    id: ID!
    title: String!
    body: String!
    affectedServiceKeys: [String!]!
    startsAt: DateTime!
    endsAt: DateTime!
    createdBy: String!
    "True once the window has started (public overview only)."
    inProgress: Boolean
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input StatusMaintenanceInput {
    title: String!
    body: String!
    affectedServiceKeys: [String!]!
    startsAt: DateTime!
    endsAt: DateTime!
  }

  type StatusMaintenancePage {
    rows: [StatusMaintenance!]!
    totalCount: Int!
  }

  "What a reporter may read back about their own report by quoting its reference."
  type ProblemReportStatus {
    reference: String!
    status: ProblemStatus!
    serviceName: String!
    updatedAt: DateTime!
  }

  "Everything the public status page renders, resolved in a single read."
  type StatusOverview {
    state: StatusState!
    generatedAt: DateTime!
    checkIntervalMinutes: Int!
    total: Int!
    operational: Int!
    degraded: Int!
    down: Int!
    uptimeToday: Float!
    uptime30d: Float!
    avgResponseMs: Int!
    services: [StatusServiceSummary!]!
    daily: [StatusDayPoint!]!
    incidents: [StatusIncident!]!
    "Upcoming and in-progress maintenance windows, soonest first."
    maintenance: [StatusMaintenance!]!
  }

  "A monitored endpoint, maintained from Tech > Status Monitors."
  type StatusMonitor {
    id: ID!
    key: String!
    name: String!
    description: String!
    category: StatusCategory!
    url: String!
    isActive: Boolean!
    order: Int!
    state: StatusState!
    lastCheckedAt: DateTime
    lastResponseMs: Int!
    lastHttpStatus: Int!
    lastError: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input StatusMonitorInput {
    key: String!
    name: String!
    description: String!
    category: StatusCategory!
    url: String!
    isActive: Boolean!
    order: Int!
  }

  type StatusMonitorPage {
    rows: [StatusMonitor!]!
    totalCount: Int!
  }

  type ProblemReport {
    id: ID!
    reference: String!
    serviceKey: String!
    serviceName: String!
    category: ProblemCategory!
    severity: ProblemSeverity!
    status: ProblemStatus!
    subject: String!
    description: String!
    reporterName: String!
    reporterEmail: String!
    pageUrl: String!
    assignee: String!
    resolutionNotes: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "Triage fields the Tech portal owns; the public form never sends these."
  input ProblemReportInput {
    serviceKey: String!
    serviceName: String!
    category: ProblemCategory!
    severity: ProblemSeverity!
    status: ProblemStatus!
    subject: String!
    description: String!
    reporterName: String!
    reporterEmail: String!
    pageUrl: String!
    assignee: String!
    resolutionNotes: String!
  }

  type ProblemReportPage {
    rows: [ProblemReport!]!
    totalCount: Int!
  }

  "What the public status page submits. Everything else is set by the server."
  input SubmitProblemReportInput {
    serviceKey: String!
    category: ProblemCategory!
    severity: ProblemSeverity!
    subject: String!
    description: String!
    reporterName: String!
    reporterEmail: String!
    pageUrl: String!
  }

  "Only the reference comes back — a reporter never reads anyone else's report."
  type ProblemReportReceipt {
    reference: String!
    submittedAt: DateTime!
  }

  extend type Query {
    "Public: no sign-in, this is what status.exyconn.com reads."
    statusOverview(days: Int): StatusOverview!
    "Public: a reporter checks on their own report by its reference. Rate-limited by address."
    problemReportStatus(reference: String!): ProblemReportStatus!

    listStatusIncidents: [StatusIncident!]!
    listStatusIncidentsPaged(input: TableQueryInput!): StatusIncidentPage!
    listStatusIncidentsStats: TableStats!
    getStatusIncident(id: ID!): StatusIncident!

    listStatusMaintenanceWindows: [StatusMaintenance!]!
    listStatusMaintenanceWindowsPaged(input: TableQueryInput!): StatusMaintenancePage!
    listStatusMaintenanceWindowsStats: TableStats!
    getStatusMaintenance(id: ID!): StatusMaintenance!

    listStatusMonitors: [StatusMonitor!]!
    listStatusMonitorsPaged(input: TableQueryInput!): StatusMonitorPage!
    listStatusMonitorsStats: TableStats!
    getStatusMonitor(id: ID!): StatusMonitor!

    listProblemReports: [ProblemReport!]!
    listProblemReportsPaged(input: TableQueryInput!): ProblemReportPage!
    listProblemReportsStats: TableStats!
    getProblemReport(id: ID!): ProblemReport!
  }

  extend type Mutation {
    "Public: filed from the status page's report form, triaged in the Tech portal."
    submitProblemReport(input: SubmitProblemReportInput!): ProblemReportReceipt!

    createStatusMonitor(input: StatusMonitorInput!): StatusMonitor!
    updateStatusMonitor(id: ID!, input: StatusMonitorInput!): StatusMonitor!
    deleteStatusMonitor(id: ID!): Boolean!

    createProblemReport(input: ProblemReportInput!): ProblemReport!
    "A status change emails the reporter, when they left an address."
    updateProblemReport(id: ID!, input: ProblemReportInput!): ProblemReport!
    deleteProblemReport(id: ID!): Boolean!

    createStatusIncident(input: StatusIncidentInput!): StatusIncident!
    "RESOLVED closes the incident and alerts the team like the monitor does."
    addStatusIncidentUpdate(id: ID!, status: IncidentUpdateStatus!, body: String!): StatusIncident!
    deleteStatusIncident(id: ID!): Boolean!

    createStatusMaintenance(input: StatusMaintenanceInput!): StatusMaintenance!
    updateStatusMaintenance(id: ID!, input: StatusMaintenanceInput!): StatusMaintenance!
    deleteStatusMaintenance(id: ID!): Boolean!
  }
`;

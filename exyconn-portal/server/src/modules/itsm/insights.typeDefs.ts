import gql from 'graphql-tag';

/** The IT portal's read models: settings, dashboard, profile, lifecycle, cost and reports. */
export const itInsightsTypeDefs = gql`
  "The IT team's own configuration. Departments, roles, SLAs and vendors live with their owners."
  type ItSettings {
    id: ID!
    "Applications an access request may name."
    applications: [String!]!
    "Applications every new joiner is given."
    onboardingApplications: [String!]!
    "Topics an IT ticket is triaged under."
    ticketTopics: [String!]!
    warrantyWarningDays: Int!
    renewalWarningDays: Int!
    certificateWarningDays: Int!
    updatedAt: DateTime!
  }

  input ItSettingsInput {
    applications: [String!]!
    onboardingApplications: [String!]!
    ticketTopics: [String!]!
    warrantyWarningDays: Int!
    renewalWarningDays: Int!
    certificateWarningDays: Int!
  }

  "IT › Dashboard in one read."
  type ItDashboard {
    openTickets: Int!
    overdueTickets: Int!
    unassignedTickets: Int!
    pendingAccess: Int!
    pendingChanges: Int!
    pendingPurchases: Int!
    assetsTotal: Int!
    assetsAssigned: Int!
    assetsInRepair: Int!
    warrantiesEnding: Int!
    licencesRenewing: Int!
    certificatesExpiring: Int!
    activeIncidents: Int!
    activeOutages: Int!
    openVulnerabilities: Int!
    criticalVulnerabilities: Int!
    recentIncidents: [ItIncident!]!
    upcomingChanges: [ItChange!]!
    announcements: [Announcement!]!
  }

  "One application someone can get into today, read off the fulfilled request history."
  type ItAccessGrant {
    employeeId: String!
    application: String!
    accessLevel: String!
    grantedAt: DateTime!
    expiresAt: DateTime
  }

  "One employee as IT sees them."
  type ItEmployeeProfile {
    id: ID!
    name: String!
    email: String!
    department: String
    designation: String
    roles: [String!]!
    isActive: Boolean!
    isBlocked: Boolean!
    lastActiveAt: DateTime
    assets: [Asset!]!
    licences: [EmployeeLicenceSeat!]!
    access: [ItAccessGrant!]!
    "Access requests waiting on a decision or approved and not yet carried out."
    openRequests: [ItAccessRequest!]!
    openTickets: Int!
  }

  "A joiner whose checklist gives IT something to do."
  type ItOnboardingRow {
    checklistId: ID!
    employeeId: String!
    employeeName: String!
    joinDate: DateTime!
    "Only the checklist items IT owns."
    items: [OnboardingItem!]!
    pendingItems: Int!
    access: [ItAccessGrant!]!
    "Onboarding applications they neither hold nor have a request open for."
    missingApplications: [String!]!
  }

  "A leaver still being worked through."
  type ItOffboardingRow {
    exitId: ID!
    employeeId: String!
    employeeName: String!
    stage: ExitStage!
    lastWorkingDate: DateTime
    "Whether they can still sign in."
    accountActive: Boolean!
    knowledgeTransferDone: Boolean!
    "Devices they still hold."
    assets: [Asset!]!
    access: [ItAccessGrant!]!
    "How many of their applications already have a revoke request open."
    revokesPending: Int!
  }

  "A labelled amount or count."
  type ItMetric {
    label: String!
    value: Float!
  }

  "What IT costs. Running costs are normalised to a month; one-off spend is per month."
  type ItCostSummary {
    saasMonthly: Float!
    cloudMonthly: Float!
    annualRunRate: Float!
    hardwareThisYear: Float!
    procurementThisYear: Float!
    byCategory: [ItMetric!]!
    "Top vendors by yearly running cost."
    byVendor: [ItMetric!]!
    "Hardware bought and software/services delivered, per month (YYYY-MM), oldest first."
    oneOffByMonth: [ItMetric!]!
  }

  type ItTicketTrendPoint {
    "YYYY-MM"
    period: String!
    opened: Int!
    resolved: Int!
  }

  type ItAssetUtilization {
    category: AssetCategory!
    total: Int!
    assigned: Int!
  }

  "IT › Reports over the last N months."
  type ItReport {
    months: Int!
    ticketsByStatus: [ItMetric!]!
    ticketTrend: [ItTicketTrendPoint!]!
    avgResolutionHours: Float!
    "Share of resolved tickets that met their SLA; 100 when none had one."
    slaMetPercent: Float!
    breachedOpen: Int!
    assetUtilization: [ItAssetUtilization!]!
    incidentsBySeverity: [ItMetric!]!
    incidentsByMonth: [ItMetric!]!
    "Mean time to resolve an incident, in hours."
    mttrHours: Float!
    spend: ItCostSummary!
  }

  extend type Query {
    itSettings: ItSettings!
    itDashboard: ItDashboard!
    itEmployeeProfile(employeeId: ID!): ItEmployeeProfile!
    itOnboarding: [ItOnboardingRow!]!
    itOffboarding: [ItOffboardingRow!]!
    itCostSummary: ItCostSummary!
    "months: 1 to 24."
    itReport(months: Int = 6): ItReport!
    "Maintenance, outage and security-alert announcements only."
    listItAnnouncementsPaged(input: TableQueryInput!): AnnouncementPage!
    "IT and SECURITY policies only."
    listItPoliciesPaged(input: TableQueryInput!): PolicyPage!
  }

  extend type Mutation {
    updateItSettings(input: ItSettingsInput!): ItSettings!
    "Opens a pre-approved GRANT for every onboarding application the joiner is missing."
    itProvisionOnboarding(employeeId: ID!): [ItAccessRequest!]!
    "Opens a pre-approved REVOKE for everything the leaver still holds."
    itRevokeAllAccess(employeeId: ID!): [ItAccessRequest!]!
    """
    Disables a leaver's account. Only someone with an exit on record, never an administrator
    and never the caller. Admin's setUserActive remains the general way to deactivate anyone.
    """
    itDisableLeaverAccount(employeeId: ID!): User!
  }
`;

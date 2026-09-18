import gql from 'graphql-tag';

/** Admin → Analytics: the company's people and tracker, and the platform above the companies. */
export const analyticsTypeDefs = gql`
  "A labelled count, or hours where the field says so."
  type AnalyticsMetric {
    label: String!
    value: Float!
  }

  "One bucket of a series over time: a YYYY-MM-DD day or a YYYY-MM month."
  type AnalyticsPoint {
    period: String!
    value: Float!
  }

  "Every account in the company."
  type UserAnalytics {
    total: Int!
    "Accounts that may sign in."
    active: Int!
    inactive: Int!
    blocked: Int!
    "Used the portal in the last five minutes."
    onlineNow: Int!
    "Accounts created in the period."
    joined: Int!
    "A user holding several roles counts once under each."
    byRole: [AnalyticsMetric!]!
    joinedPerDay: [AnalyticsPoint!]!
  }

  "The people holding the EMPLOYEE role."
  type EmployeeAnalytics {
    total: Int!
    byStatus: [AnalyticsMetric!]!
    byDepartment: [AnalyticsMetric!]!
    byWorkLocation: [AnalyticsMetric!]!
    "ISO 3166-1 alpha-2 labels; 'Not set' follows the company's country."
    byCountry: [AnalyticsMetric!]!
  }

  "The time tracker. Hours and sessions cover the period; access and devices are as of now."
  type TrackerAnalytics {
    usersWithAccess: Int!
    "People with access who have accepted the monitoring notice."
    consented: Int!
    activeDevices: Int!
    screenshots: Int!
    sessions: Int!
    "People who recorded any time in the period."
    trackedUsers: Int!
    activeHours: Float!
    idleHours: Float!
    "Active time as a share of all tracked time, 0-100."
    activityPercent: Float!
    "Active hours per day."
    hoursPerDay: [AnalyticsPoint!]!
    "Active hours per person, most first."
    topUsers: [AnalyticsMetric!]!
    "Hours per application, most first."
    topApps: [AnalyticsMetric!]!
    devicesByPlatform: [AnalyticsMetric!]!
    presence: [AnalyticsMetric!]!
    manualEntriesByStatus: [AnalyticsMetric!]!
  }

  type WorkspaceAnalytics {
    "The period covered, in days, ending today."
    days: Int!
    "The workspace timezone the days are read in."
    timezone: String!
    users: UserAnalytics!
    employees: EmployeeAnalytics!
    tracker: TrackerAnalytics!
  }

  "Every organization on the platform."
  type PlatformAnalytics {
    organizations: Int!
    activeOrganizations: Int!
    users: Int!
    employees: Int!
    trackedUsers: Int!
    organizationsByStatus: [AnalyticsMetric!]!
    "ISO 3166-1 alpha-2 labels."
    organizationsByCountry: [AnalyticsMetric!]!
    "User accounts per organization, largest first."
    usersByOrganization: [AnalyticsMetric!]!
    "Organizations created per month over the last year."
    organizationsPerMonth: [AnalyticsPoint!]!
  }

  extend type Query {
    "The company's users, employees and tracker over the last \`days\` days (1-365). ADMIN."
    workspaceAnalytics(days: Int = 30): WorkspaceAnalytics!
    "Organizations and their size across the whole platform. SUPER_ADMIN."
    platformAnalytics: PlatformAnalytics!
  }
`;

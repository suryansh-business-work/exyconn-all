import gql from 'graphql-tag';

/** CRM › Overview: one period's numbers, charts and findings (see crm.dashboard.ts). */
export const crmDashboardTypeDefs = gql`
  "How the time charts are bucketed: days for a month, weeks up to about six months, months beyond."
  enum CrmDashboardGranularity {
    DAY
    WEEK
    MONTH
  }

  "Headline numbers. Open pipeline and overdue work are as of now; the rest cover the period."
  type CrmDashboardKpis {
    openDealCount: Int!
    openPipelineValue: Float!
    weightedPipelineValue: Float!
    wonCount: Int!
    wonValue: Float!
    lostCount: Int!
    "Won over won plus lost in the period, 0-1; null when nothing closed."
    winRate: Float
    newLeads: Int!
    newContacts: Int!
    newCompanies: Int!
    overdueTasks: Int!
    overdueReminders: Int!
    meetingsBooked: Int!
  }

  type CrmStageValue {
    stage: DealStage!
    count: Int!
    value: Float!
  }

  "Won deals in one period; key is the period in the company's zone (2026-10-19, 2026-W42, 2026-10)."
  type CrmPeriodValue {
    key: String!
    start: DateTime!
    count: Int!
    value: Float!
  }

  type CrmSourceCount {
    source: LeadSource!
    count: Int!
    won: Int!
  }

  "Activities logged in one period, per type."
  type CrmActivityPeriod {
    key: String!
    start: DateTime!
    call: Int!
    email: Int!
    meeting: Int!
    note: Int!
    task: Int!
  }

  type CrmOwnerValue {
    owner: String!
    value: Float!
    count: Int!
  }

  enum CrmInsightKind {
    LEAD_SOURCE_CONVERSION
    COMPANY_ORIGIN_CONVERSION
    STUCK_DEALS
    PAST_CLOSE_DATE
    OVERDUE_REMINDERS
    OVERDUE_TASKS
  }

  enum CrmInsightTone {
    POSITIVE
    WARNING
  }

  "A finding from the data. The client writes the sentence from kind and these values."
  type CrmInsight {
    kind: CrmInsightKind!
    tone: CrmInsightTone!
    count: Int!
    "The group it is about: a lead source, a record origin or a deal stage."
    label: String!
    "The group it is compared with, for a conversion finding."
    compareLabel: String!
    ratio: Float!
    days: Int!
  }

  type CrmDashboard {
    from: DateTime!
    to: DateTime!
    "The admin-configured zone the periods are counted in."
    timezone: String!
    granularity: CrmDashboardGranularity!
    kpis: CrmDashboardKpis!
    pipelineByStage: [CrmStageValue!]!
    wonOverTime: [CrmPeriodValue!]!
    leadsBySource: [CrmSourceCount!]!
    activitiesOverTime: [CrmActivityPeriod!]!
    topOwners: [CrmOwnerValue!]!
    insights: [CrmInsight!]!
  }

  extend type Query {
    "CRM overview for from (inclusive) to to (exclusive); at most three years."
    crmDashboard(from: DateTime!, to: DateTime!): CrmDashboard!
  }
`;

import gql from 'graphql-tag';

export const complianceDashboardTypeDefs = gql`
  "A count of one group, for the dashboard's breakdowns."
  type ComplianceSlice {
    label: String!
    value: Int!
  }

  "Where the management system stands, measured when the query runs."
  type ComplianceOverview {
    risks: Int!
    openRisks: Int!
    "Open risks whose review date has passed — how a register quietly goes stale."
    risksPastReview: Int!
    findings: Int!
    openFindings: Int!
    "Corrective actions past their date and not yet verified."
    findingsOverdue: Int!
    audits: Int!
    auditsPlanned: Int!
    objectives: Int!
    "Objectives the owner has marked at risk or already missed."
    objectivesAtRisk: Int!
    reviews: Int!
    "When leadership last met. Null when they never have."
    lastReviewOn: DateTime
    lastReviewTitle: String!
    risksByStatus: [ComplianceSlice!]!
    findingsByType: [ComplianceSlice!]!
    "Open risks by their RESIDUAL level — the risk carried after the controls."
    residualHeat: [ComplianceSlice!]!
    "Audits performed against each standard in the last year. Zero is the gap."
    standardCoverage: [ComplianceSlice!]!
  }

  extend type Query {
    "Compliance only — the state of the whole management system on one screen."
    complianceOverview: ComplianceOverview!
  }
`;

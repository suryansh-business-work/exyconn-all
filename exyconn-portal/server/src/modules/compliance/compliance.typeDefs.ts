import gql from 'graphql-tag';

export const complianceTypeDefs = gql`
  "A management system standard the company runs to. A record may answer to several."
  enum ManagementStandard {
    ISO_9001
    ISO_27001
    ISO_45001
    ISO_14001
  }

  "What a compliance record is about — one list across all four standards."
  enum ComplianceCategory {
    QUALITY
    INFORMATION_SECURITY
    HEALTH_SAFETY
    ENVIRONMENT
    OPERATIONAL
    LEGAL
    FINANCIAL
    SUPPLIER
    PEOPLE
  }

  "How a risk is being dealt with (ISO 31000)."
  enum RiskTreatment {
    REDUCE
    AVOID
    TRANSFER
    ACCEPT
  }

  enum RiskStatus {
    IDENTIFIED
    TREATING
    MONITORING
    CLOSED
  }

  "Where a 1-25 rating lands. Derived from the rating, never stored."
  enum RiskLevel {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  """
  One risk in the company's register.

  Both ratings are kept: inherent is the risk with nothing done about it, residual is what is
  left after the controls named on it. The scores and levels are derived from the two axes.
  """
  type Risk {
    id: ID!
    reference: String!
    title: String!
    description: String!
    standards: [ManagementStandard!]!
    category: ComplianceCategory!
    subject: String!
    ownerId: String!
    ownerName: String!
    likelihood: Int!
    impact: Int!
    "likelihood x impact, before the controls."
    inherentScore: Int!
    inherentLevel: RiskLevel!
    treatment: RiskTreatment!
    controls: String!
    residualLikelihood: Int!
    residualImpact: Int!
    "What is left once the controls are working."
    residualScore: Int!
    residualLevel: RiskLevel!
    status: RiskStatus!
    identifiedOn: DateTime!
    reviewDueOn: DateTime
    closedOn: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "The reference is drawn from the company's own series on create; never sent by a client."
  input RiskInput {
    title: String!
    description: String!
    standards: [ManagementStandard!]!
    category: ComplianceCategory!
    subject: String!
    ownerId: String!
    ownerName: String!
    likelihood: Int!
    impact: Int!
    treatment: RiskTreatment!
    controls: String!
    residualLikelihood: Int!
    residualImpact: Int!
    status: RiskStatus!
    identifiedOn: DateTime!
    reviewDueOn: DateTime
    closedOn: DateTime
  }

  type RiskPage {
    rows: [Risk!]!
    totalCount: Int!
  }

  enum ObjectiveScope {
    COMPANY
    DEPARTMENT
    PROCESS
  }

  enum ObjectiveFrequency {
    MONTHLY
    QUARTERLY
    HALF_YEARLY
    YEARLY
  }

  enum ObjectiveStatus {
    PLANNED
    ON_TRACK
    AT_RISK
    MET
    MISSED
  }

  """
  An objective the company set itself and measures (clause 6.2 of every one of the standards).

  The organisation's own, not an employee's appraisal goal — those live in HR.
  """
  type Objective {
    id: ID!
    title: String!
    description: String!
    standards: [ManagementStandard!]!
    category: ComplianceCategory!
    scope: ObjectiveScope!
    area: String!
    ownerId: String!
    ownerName: String!
    measure: String!
    unit: String!
    baseline: Float!
    target: Float!
    actual: Float!
    "How far it has come from its baseline towards its target, 0-100."
    achievementPercent: Int!
    frequency: ObjectiveFrequency!
    periodStart: DateTime!
    periodEnd: DateTime!
    status: ObjectiveStatus!
    plan: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ObjectiveInput {
    title: String!
    description: String!
    standards: [ManagementStandard!]!
    category: ComplianceCategory!
    scope: ObjectiveScope!
    area: String!
    ownerId: String!
    ownerName: String!
    measure: String!
    unit: String!
    baseline: Float!
    target: Float!
    actual: Float!
    frequency: ObjectiveFrequency!
    periodStart: DateTime!
    periodEnd: DateTime!
    status: ObjectiveStatus!
    plan: String!
  }

  type ObjectivePage {
    rows: [Objective!]!
    totalCount: Int!
  }

  extend type Query {
    listRisks: [Risk!]!
    listRisksPaged(input: TableQueryInput!): RiskPage!
    listRisksStats: TableStats!
    getRisk(id: ID!): Risk!
    listObjectives: [Objective!]!
    listObjectivesPaged(input: TableQueryInput!): ObjectivePage!
    listObjectivesStats: TableStats!
    getObjective(id: ID!): Objective!
  }

  extend type Mutation {
    createRisk(input: RiskInput!): Risk!
    updateRisk(id: ID!, input: RiskInput!): Risk!
    deleteRisk(id: ID!): Boolean!
    createObjective(input: ObjectiveInput!): Objective!
    updateObjective(id: ID!, input: ObjectiveInput!): Objective!
    deleteObjective(id: ID!): Boolean!
  }
`;

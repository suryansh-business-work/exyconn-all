import gql from 'graphql-tag';

export const complianceAuditsTypeDefs = gql`
  "Who is auditing whom."
  enum AuditKind {
    INTERNAL
    EXTERNAL
    SUPPLIER
  }

  enum AuditStatus {
    PLANNED
    IN_PROGRESS
    REPORTED
    CLOSED
  }

  """
  One audit in the company's programme (clause 9.2).

  A year's programme is the audits planned for it: scope says what was audited and criteria
  says what it was audited against, because a finding needs both to mean anything later.
  """
  type InternalAudit {
    id: ID!
    reference: String!
    title: String!
    kind: AuditKind!
    standards: [ManagementStandard!]!
    scope: String!
    criteria: String!
    leadAuditorId: String!
    leadAuditorName: String!
    auditeeName: String!
    plannedOn: DateTime!
    performedOn: DateTime
    status: AuditStatus!
    summary: String!
    conclusion: String!
    "What this audit raised, so the report and its findings are read together."
    findings: [Finding!]!
    "The audit's own papers: the plan, the checklist, the report as it was issued."
    evidence: [FileAttachment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input InternalAuditInput {
    title: String!
    kind: AuditKind!
    standards: [ManagementStandard!]!
    scope: String!
    criteria: String!
    leadAuditorId: String!
    leadAuditorName: String!
    auditeeName: String!
    plannedOn: DateTime!
    performedOn: DateTime
    status: AuditStatus!
    summary: String!
    conclusion: String!
    evidence: [FileAttachmentInput!]
  }

  type InternalAuditPage {
    rows: [InternalAudit!]!
    totalCount: Int!
  }

  "Where a finding came from. One register whatever raised it."
  enum FindingSource {
    INTERNAL_AUDIT
    EXTERNAL_AUDIT
    CUSTOMER_COMPLAINT
    INCIDENT
    MANAGEMENT_REVIEW
    EMPLOYEE_REPORT
    SUPPLIER
    OTHER
  }

  "How serious it is — the four an auditor uses."
  enum FindingType {
    MAJOR_NONCONFORMITY
    MINOR_NONCONFORMITY
    OBSERVATION
    OPPORTUNITY
  }

  enum FindingStatus {
    OPEN
    ACTION_AGREED
    IMPLEMENTED
    VERIFIED
    CLOSED
  }

  """
  A nonconformity and the corrective action taken about it (clause 10.2).

  One record rather than two: a finding is not closed when something was done about it, but
  when somebody checked that what was done worked. The API refuses to close one that has not
  been verified.
  """
  type Finding {
    id: ID!
    reference: String!
    title: String!
    description: String!
    source: FindingSource!
    auditId: String!
    riskId: String!
    standards: [ManagementStandard!]!
    category: ComplianceCategory!
    clause: String!
    type: FindingType!
    immediateAction: String!
    rootCause: String!
    correctiveAction: String!
    ownerId: String!
    ownerName: String!
    raisedOn: DateTime!
    dueOn: DateTime
    status: FindingStatus!
    verifiedOn: DateTime
    verifiedByName: String!
    "Whether the correction actually worked. Null until it has been verified."
    effective: Boolean
    effectivenessNote: String!
    closedOn: DateTime
    "What proves it: the screenshot, the signed record, the changed procedure."
    evidence: [FileAttachment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input FindingInput {
    title: String!
    description: String!
    source: FindingSource!
    auditId: String!
    riskId: String!
    standards: [ManagementStandard!]!
    category: ComplianceCategory!
    clause: String!
    type: FindingType!
    immediateAction: String!
    rootCause: String!
    correctiveAction: String!
    ownerId: String!
    ownerName: String!
    raisedOn: DateTime!
    dueOn: DateTime
    status: FindingStatus!
    verifiedOn: DateTime
    verifiedByName: String
    effective: Boolean
    effectivenessNote: String
    closedOn: DateTime
    evidence: [FileAttachmentInput!]
  }

  type FindingPage {
    rows: [Finding!]!
    totalCount: Int!
  }

  extend type Query {
    listInternalAudits: [InternalAudit!]!
    listInternalAuditsPaged(input: TableQueryInput!): InternalAuditPage!
    listInternalAuditsStats: TableStats!
    getInternalAudit(id: ID!): InternalAudit!
    listFindings: [Finding!]!
    listFindingsPaged(input: TableQueryInput!): FindingPage!
    listFindingsStats: TableStats!
    getFinding(id: ID!): Finding!
  }

  extend type Mutation {
    createInternalAudit(input: InternalAuditInput!): InternalAudit!
    updateInternalAudit(id: ID!, input: InternalAuditInput!): InternalAudit!
    deleteInternalAudit(id: ID!): Boolean!
    createFinding(input: FindingInput!): Finding!
    updateFinding(id: ID!, input: FindingInput!): Finding!
    deleteFinding(id: ID!): Boolean!
  }
`;

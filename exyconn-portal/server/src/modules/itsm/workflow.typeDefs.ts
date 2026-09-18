import gql from 'graphql-tag';

/** The IT workflows: access requests, changes, incidents and purchases. */
export const itWorkflowTypeDefs = gql`
  enum ItDecision {
    APPROVED
    REJECTED
  }

  enum ItAccessKind {
    GRANT
    ROLE_CHANGE
    REVOKE
    PASSWORD_RESET
  }

  enum ItAccessStatus {
    PENDING
    APPROVED
    REJECTED
    FULFILLED
    CANCELLED
  }

  enum ItChangeType {
    STANDARD
    NORMAL
    EMERGENCY
  }

  enum ItRisk {
    LOW
    MEDIUM
    HIGH
  }

  enum ItChangeStatus {
    DRAFT
    PENDING_APPROVAL
    APPROVED
    REJECTED
    SCHEDULED
    IMPLEMENTED
    FAILED
    ROLLED_BACK
  }

  enum ItIncidentSeverity {
    SEV1
    SEV2
    SEV3
    SEV4
  }

  enum ItIncidentCategory {
    OUTAGE
    NETWORK
    SECURITY
    APPLICATION
    HARDWARE
    OTHER
  }

  enum ItIncidentStatus {
    INVESTIGATING
    IDENTIFIED
    MONITORING
    RESOLVED
    CLOSED
  }

  enum ItPurchaseKind {
    HARDWARE
    SOFTWARE
    SERVICE
  }

  enum ItPurchaseStatus {
    REQUESTED
    QUOTED
    APPROVED
    REJECTED
    ORDERED
    RECEIVED
    CANCELLED
  }

  """
  A request to grant, change, revoke or reset someone's access to an application. The
  password itself is never recorded — only that the reset was asked for, approved and done.
  """
  type ItAccessRequest {
    id: ID!
    employeeId: String!
    employeeName: String!
    application: String!
    kind: ItAccessKind!
    accessLevel: String!
    reason: String!
    status: ItAccessStatus!
    requestedByName: String!
    decidedByName: String!
    decidedAt: DateTime
    decisionNote: String!
    fulfilledAt: DateTime
    expiresAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "Status and decision fields are set by decide/fulfil, never by this input."
  input ItAccessRequestInput {
    employeeId: String!
    application: String!
    kind: ItAccessKind!
    accessLevel: String
    reason: String!
    expiresAt: DateTime
  }

  type ItAccessRequestPage {
    rows: [ItAccessRequest!]!
    totalCount: Int!
  }

  "A planned change to a system: a deployment, a configuration change, a migration."
  type ItChange {
    id: ID!
    title: String!
    description: String!
    type: ItChangeType!
    risk: ItRisk!
    environment: ItEnvironment!
    system: String!
    status: ItChangeStatus!
    plannedStart: DateTime!
    plannedEnd: DateTime!
    implementedAt: DateTime
    ownerName: String!
    rollbackPlan: String!
    decidedByName: String!
    decidedAt: DateTime
    decisionNote: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "APPROVED and REJECTED are refused here — they come only from decideItChange."
  input ItChangeInput {
    title: String!
    description: String!
    type: ItChangeType!
    risk: ItRisk!
    environment: ItEnvironment!
    system: String!
    status: ItChangeStatus!
    plannedStart: DateTime!
    plannedEnd: DateTime!
    ownerName: String
    rollbackPlan: String
  }

  type ItChangePage {
    rows: [ItChange!]!
    totalCount: Int!
  }

  "One entry on an incident's timeline."
  type ItIncidentUpdate {
    id: ID!
    at: DateTime!
    status: ItIncidentStatus!
    note: String!
    authorName: String!
  }

  "An action the post-incident review decided on."
  type ItIncidentFollowUp {
    id: ID!
    title: String!
    ownerName: String!
    dueAt: DateTime
    done: Boolean!
  }

  input ItIncidentFollowUpInput {
    title: String!
    ownerName: String
    dueAt: DateTime
    done: Boolean!
  }

  "An internal IT incident with its timeline, root cause and follow-up actions."
  type ItIncident {
    id: ID!
    title: String!
    description: String!
    severity: ItIncidentSeverity!
    category: ItIncidentCategory!
    status: ItIncidentStatus!
    startedAt: DateTime!
    resolvedAt: DateTime
    impact: String!
    affectedSystems: [String!]!
    commanderName: String!
    timeline: [ItIncidentUpdate!]!
    rootCause: String!
    followUps: [ItIncidentFollowUp!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "The timeline is appended by addItIncidentUpdate and by status changes, never set here."
  input ItIncidentInput {
    title: String!
    description: String!
    severity: ItIncidentSeverity!
    category: ItIncidentCategory!
    status: ItIncidentStatus!
    startedAt: DateTime!
    impact: String
    affectedSystems: [String!]
    commanderName: String
    rootCause: String
    followUps: [ItIncidentFollowUpInput!]
  }

  type ItIncidentPage {
    rows: [ItIncident!]!
    totalCount: Int!
  }

  "One vendor's price for a purchase request."
  type ItPurchaseQuote {
    id: ID!
    vendor: String!
    amount: Float!
    notes: String!
  }

  input ItPurchaseQuoteInput {
    vendor: String!
    amount: Float!
    notes: String
  }

  "A request to buy hardware, software or a service, from the ask to the delivery."
  type ItPurchaseRequest {
    id: ID!
    title: String!
    kind: ItPurchaseKind!
    quantity: Int!
    estimatedCost: Float!
    requestedForName: String!
    justification: String!
    quotes: [ItPurchaseQuote!]!
    status: ItPurchaseStatus!
    decidedByName: String!
    decidedAt: DateTime
    decisionNote: String!
    orderReference: String!
    receivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "APPROVED and REJECTED are refused here — they come only from decideItPurchaseRequest."
  input ItPurchaseRequestInput {
    title: String!
    kind: ItPurchaseKind!
    quantity: Int!
    estimatedCost: Float!
    requestedForName: String
    justification: String!
    quotes: [ItPurchaseQuoteInput!]
    status: ItPurchaseStatus!
    orderReference: String
  }

  type ItPurchaseRequestPage {
    rows: [ItPurchaseRequest!]!
    totalCount: Int!
  }

  extend type Query {
    listItAccessRequests: [ItAccessRequest!]!
    """
    Search matches employee, application and reason. Filter kind with EQUALS; the
    Password page asks for kind PASSWORD_RESET.
    """
    listItAccessRequestsPaged(input: TableQueryInput!): ItAccessRequestPage!
    listItAccessRequestsStats: TableStats!
    getItAccessRequest(id: ID!): ItAccessRequest!
    listItChanges: [ItChange!]!
    listItChangesPaged(input: TableQueryInput!): ItChangePage!
    listItChangesStats: TableStats!
    getItChange(id: ID!): ItChange!
    listItIncidents: [ItIncident!]!
    listItIncidentsPaged(input: TableQueryInput!): ItIncidentPage!
    listItIncidentsStats: TableStats!
    getItIncident(id: ID!): ItIncident!
    listItPurchaseRequests: [ItPurchaseRequest!]!
    listItPurchaseRequestsPaged(input: TableQueryInput!): ItPurchaseRequestPage!
    listItPurchaseRequestsStats: TableStats!
    getItPurchaseRequest(id: ID!): ItPurchaseRequest!
  }

  extend type Mutation {
    createItAccessRequest(input: ItAccessRequestInput!): ItAccessRequest!
    updateItAccessRequest(id: ID!, input: ItAccessRequestInput!): ItAccessRequest!
    deleteItAccessRequest(id: ID!): Boolean!
    "Approve or reject a PENDING access request."
    decideItAccessRequest(id: ID!, decision: ItDecision!, note: String): ItAccessRequest!
    "Mark an APPROVED request as carried out in the target system."
    fulfilItAccessRequest(id: ID!): ItAccessRequest!
    "Withdraw a request that has not been carried out."
    cancelItAccessRequest(id: ID!): ItAccessRequest!
    createItChange(input: ItChangeInput!): ItChange!
    updateItChange(id: ID!, input: ItChangeInput!): ItChange!
    deleteItChange(id: ID!): Boolean!
    "Approve or reject a change awaiting approval."
    decideItChange(id: ID!, decision: ItDecision!, note: String): ItChange!
    createItIncident(input: ItIncidentInput!): ItIncident!
    updateItIncident(id: ID!, input: ItIncidentInput!): ItIncident!
    deleteItIncident(id: ID!): Boolean!
    "Append a timeline entry, moving the incident to the given status."
    addItIncidentUpdate(id: ID!, status: ItIncidentStatus!, note: String!): ItIncident!
    createItPurchaseRequest(input: ItPurchaseRequestInput!): ItPurchaseRequest!
    updateItPurchaseRequest(id: ID!, input: ItPurchaseRequestInput!): ItPurchaseRequest!
    deleteItPurchaseRequest(id: ID!): Boolean!
    "Approve or reject a purchase request that is requested or quoted."
    decideItPurchaseRequest(id: ID!, decision: ItDecision!, note: String): ItPurchaseRequest!
  }
`;

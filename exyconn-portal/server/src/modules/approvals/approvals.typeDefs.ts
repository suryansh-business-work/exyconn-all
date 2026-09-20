import gql from 'graphql-tag';

export const approvalsTypeDefs = gql`
  enum ApprovalDecision {
    APPROVED
    REJECTED
  }

  """
  One decision waiting on the signed-in user, read straight out of the collection that
  owns it. There is no approvals collection — see the approvals module for why.
  """
  type ApprovalItem {
    "Composite: the source kind and the record id, joined by a colon — LEAVE:663f…"
    id: ID!
    kind: String!
    kindLabel: String!
    title: String!
    summary: String!
    requestedById: String!
    requestedByName: String!
    requestedAt: DateTime!
    "Portal path to the module's own screen for this decision."
    link: String!
    "Money at stake, when the decision is about money."
    amount: Float
    currency: String
  }

  "How many are waiting in one source — the counts behind the queue's tabs."
  type ApprovalGroup {
    kind: String!
    label: String!
    count: Int!
  }

  type ApprovalQueue {
    items: [ApprovalItem!]!
    groups: [ApprovalGroup!]!
    totalCount: Int!
  }

  """
  One person standing in for another's approvals while they are away. A window rather than a
  switch, so nobody has to remember to turn it off.
  """
  type ApprovalDelegation {
    id: ID!
    fromEmployeeId: String!
    fromName: String!
    toEmployeeId: String!
    toName: String!
    fromDate: DateTime!
    toDate: DateTime!
    note: String!
    "Whether it covers today, which is the only question the queue asks."
    active: Boolean!
  }

  "What this person has arranged, and whose approvals they are covering."
  type MyApprovalDelegations {
    given: [ApprovalDelegation!]!
    held: [ApprovalDelegation!]!
  }

  input ApprovalDelegationInput {
    toEmployeeId: String!
    fromDate: DateTime!
    "Inclusive — a delegation until Friday covers Friday."
    toDate: DateTime!
    note: String
  }

  extend type Query {
    """
    Everything awaiting the caller across every module, newest first. The kind argument narrows to
    one source; it can never widen what the caller is allowed to see.
    """
    myApprovals(kind: String): ApprovalQueue!
    "The badge count for the same queue."
    myPendingApprovalCount: Int!
    "Delegations this person has arranged, and the ones they are covering."
    myApprovalDelegations: MyApprovalDelegations!
  }

  extend type Mutation {
    "Approves or rejects one item, through the owning module's own decision service."
    decideApproval(id: ID!, decision: ApprovalDecision!, note: String): Boolean!
    "Hands this person's approvals to a colleague for a window."
    delegateApprovals(input: ApprovalDelegationInput!): ApprovalDelegation!
    "Calls off a delegation. Only whoever arranged it may."
    endApprovalDelegation(id: ID!): Boolean!
  }
`;

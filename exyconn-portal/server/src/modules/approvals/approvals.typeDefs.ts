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

  extend type Query {
    """
    Everything awaiting the caller across every module, newest first. The kind argument narrows to
    one source; it can never widen what the caller is allowed to see.
    """
    myApprovals(kind: String): ApprovalQueue!
    "The badge count for the same queue."
    myPendingApprovalCount: Int!
  }

  extend type Mutation {
    "Approves or rejects one item, through the owning module's own decision service."
    decideApproval(id: ID!, decision: ApprovalDecision!, note: String): Boolean!
  }
`;

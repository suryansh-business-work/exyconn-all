import gql from 'graphql-tag';

/**
 * `sharedProject` is deliberately unauthenticated — the whole point of a share link is that
 * the client has no portal account. It answers with a narrow, read-only projection and with
 * null for a token that is unknown, expired or revoked.
 */
export const shareTypeDefs = gql`
  "A read-only link handed to a client. The token itself is only ever returned once."
  type ProjectShare {
    id: ID!
    projectId: ID!
    label: String!
    expiresAt: DateTime!
    createdByName: String!
    revokedAt: DateTime
    "False once the link has been revoked or has expired."
    isLive: Boolean!
    createdAt: DateTime!
  }

  "A share and the one-time URL to hand over. The URL is not recoverable afterwards."
  type ProjectShareCreated {
    share: ProjectShare!
    "The full link, e.g. https://status.exyconn.com/project/<token>."
    url: String!
  }

  type SharedMilestone {
    name: String!
    dueOn: DateTime
    state: MilestoneState!
  }

  "How many tickets sit in one board column."
  type SharedTicketCount {
    status: String!
    count: Int!
  }

  """
  What a client sees through a share link. Names, dates, budget against tracked hours,
  milestones and ticket counts — never comments, screenshots or per-person time.
  """
  type SharedProjectView {
    name: String!
    clientName: String!
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
    budgetHours: Float
    trackedHours: Float!
    milestones: [SharedMilestone!]!
    ticketCounts: [SharedTicketCount!]!
  }

  extend type Query {
    "Lists the read-only client links made for a project, live or not."
    projectShares(projectId: ID!): [ProjectShare!]!
    "Public. Null when the token is unknown, expired or revoked — the page says so."
    sharedProject(token: String!): SharedProjectView
  }

  extend type Mutation {
    "Creates a public read-only link to a project's progress for a client and returns its URL once. Confirm with the person first."
    createProjectShare(
      projectId: ID!
      "Who or what the link is for."
      label: String!
      "Days until the link expires, 1 to 365."
      expiresInDays: Int!
    ): ProjectShareCreated!
    "Revokes a client project link so it stops working at once."
    revokeProjectShare(id: ID!): ProjectShare!
  }
`;

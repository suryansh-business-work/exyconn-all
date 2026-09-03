import gql from 'graphql-tag';

/**
 * Support-team console schema. Reuses the SupportTicket type & SupportStatus enum
 * defined by the employee module (employees raise the tickets there); this only
 * adds the team-facing operations: list every ticket, assign it, move it through
 * its lifecycle, and hold the conversation on it.
 */
export const supportTypeDefs = gql`
  "One message on a ticket. Internal notes are hidden from the employee."
  type SupportReply {
    id: ID!
    ticketId: String!
    authorId: String!
    authorName: String!
    body: String!
    internal: Boolean!
    createdAt: DateTime!
  }

  "Somebody the support team can hand a ticket to."
  type SupportAgent {
    id: ID!
    name: String!
    email: String!
  }

  extend type Query {
    "SUPPORT/ADMIN: every employee support ticket, newest first."
    listSupportTickets: [SupportTicket!]!
    "SUPPORT/ADMIN: the whole thread on one ticket, internal notes included."
    listSupportReplies(ticketId: ID!): [SupportReply!]!
    "SUPPORT/ADMIN: who a ticket can be assigned to."
    listSupportAgents: [SupportAgent!]!
  }

  extend type Mutation {
    "SUPPORT/ADMIN: move a ticket through its lifecycle."
    setSupportTicketStatus(id: ID!, status: SupportStatus!): SupportTicket!
    "SUPPORT/ADMIN: hand a ticket to someone, or pass an empty id to unassign it."
    assignSupportTicket(id: ID!, assigneeId: String!): SupportTicket!
    "SUPPORT/ADMIN: reply on a ticket, or leave an internal note."
    addSupportReply(ticketId: ID!, body: String!, internal: Boolean!): SupportReply!
  }
`;

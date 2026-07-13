import gql from 'graphql-tag';

/**
 * Support-team console schema. Reuses the SupportTicket type & SupportStatus enum
 * defined by the employee module (employees raise the tickets there); this only
 * adds the team-facing list-all + status-update operations.
 */
export const supportTypeDefs = gql`
  extend type Query {
    "SUPPORT/ADMIN: every employee support ticket, newest first."
    listSupportTickets: [SupportTicket!]!
  }

  extend type Mutation {
    "SUPPORT/ADMIN: move a ticket through its lifecycle."
    setSupportTicketStatus(id: ID!, status: SupportStatus!): SupportTicket!
  }
`;

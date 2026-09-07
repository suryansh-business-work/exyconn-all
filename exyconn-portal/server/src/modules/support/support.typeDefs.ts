import gql from 'graphql-tag';

/**
 * Support-desk schema. Reuses the SupportTicket type & SupportStatus enum defined by the
 * employee module (employees raise tickets there) and extends it with everything the desk
 * needs on top: who raised it when it was not an employee, its SLA clocks and its files.
 * The team-facing operations — list every ticket, assign it, move it through its lifecycle,
 * hold the conversation on it — live here, as do the two a customer calls without an account.
 */
export const supportTypeDefs = gql`
  "Who raised a ticket: somebody who works here, or a customer."
  enum SupportRequester {
    EMPLOYEE
    CLIENT
  }

  "How a ticket stands against the resolution time promised for its priority."
  enum SlaState {
    ON_TRACK
    DUE_SOON
    BREACHED
    MET
  }

  "A file posted with a ticket or a reply. Hosted on the portal's image CDN."
  type TicketAttachment {
    url: String!
    name: String!
    contentType: String!
    uploadedBy: String!
    uploadedAt: DateTime!
  }

  "What a client sends when it posts a file: the server stamps who and when."
  input TicketAttachmentInput {
    url: String!
    name: String!
    contentType: String
  }

  extend type SupportTicket {
    "EMPLOYEE for every ticket raised in the portal; CLIENT for the public customer form."
    requesterType: SupportRequester!
    "Quotable handle (EXY-4KQ7W2) so a customer can follow the ticket without an account."
    reference: String!
    "Set only when the customer's address matched a client on file."
    clientId: String!
    clientName: String!
    "Who to write back to on a customer ticket. Empty on an employee ticket."
    requesterName: String!
    requesterEmail: String!
    attachments: [TicketAttachment!]!
    "When the SLA says it must be resolved. Null when no active policy covers its priority."
    dueAt: DateTime
    "Stamped by the first public reply."
    firstRespondedAt: DateTime
    "Stamped when it reaches RESOLVED or CLOSED; cleared when it is reopened."
    resolvedAt: DateTime
    slaState: SlaState!
  }

  "One message on a ticket. Internal notes are hidden from the requester."
  type SupportReply {
    id: ID!
    ticketId: String!
    authorId: String!
    authorName: String!
    body: String!
    internal: Boolean!
    attachments: [TicketAttachment!]!
    createdAt: DateTime!
  }

  "Somebody the support team can hand a ticket to."
  type SupportAgent {
    id: ID!
    name: String!
    email: String!
  }

  type SupportTicketPage {
    rows: [SupportTicket!]!
    totalCount: Int!
  }

  "What the support team promises for one priority."
  type SupportSlaPolicy {
    id: ID!
    priority: SupportPriority!
    firstResponseMinutes: Int!
    resolutionMinutes: Int!
    active: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input SupportSlaPolicyInput {
    priority: SupportPriority!
    firstResponseMinutes: Int!
    resolutionMinutes: Int!
    active: Boolean!
  }

  type SupportSlaPolicyPage {
    rows: [SupportSlaPolicy!]!
    totalCount: Int!
  }

  "How the queue stands against its deadlines."
  type SupportSlaSummary {
    onTrack: Int!
    dueSoon: Int!
    "Open past its deadline, plus everything that was resolved late."
    breached: Int!
  }

  "What the public customer form sends. Every field is re-validated on the server."
  input ClientSupportTicketInput {
    requesterName: String!
    requesterEmail: String!
    subject: String!
    category: SupportCategory!
    description: String!
    priority: SupportPriority!
  }

  "A customer following their own ticket: where it stands and what has been said publicly."
  type ClientTicketStatus {
    reference: String!
    subject: String!
    status: SupportStatus!
    updatedAt: DateTime!
    replies: [SupportReply!]!
  }

  extend type Query {
    "SUPPORT/ADMIN: every support ticket, newest first."
    listSupportTickets: [SupportTicket!]!
    "SUPPORT/ADMIN: one server-side page of tickets, with the employee's name resolved."
    listSupportTicketsPaged(input: TableQueryInput!): SupportTicketPage!
    "SUPPORT/ADMIN: ticket counts by status, priority and category in one aggregation."
    listSupportTicketsStats: TableStats!
    "SUPPORT/ADMIN: one ticket in full, for its own page."
    getSupportTicket(id: ID!): SupportTicket!
    "SUPPORT/ADMIN: how the queue stands against its SLA deadlines."
    supportSlaSummary: SupportSlaSummary!
    "SUPPORT/ADMIN: the whole thread on one ticket, internal notes included."
    listSupportReplies(ticketId: ID!): [SupportReply!]!
    "SUPPORT/ADMIN: who a ticket can be assigned to."
    listSupportAgents: [SupportAgent!]!
    "SUPPORT/ADMIN: the promise made for each priority."
    listSupportSlaPolicies: [SupportSlaPolicy!]!
    listSupportSlaPoliciesPaged(input: TableQueryInput!): SupportSlaPolicyPage!
    listSupportSlaPoliciesStats: TableStats!
    getSupportSlaPolicy(id: ID!): SupportSlaPolicy!
    """
    Unauthenticated — a customer follows their ticket with the reference they were given
    and the address they raised it from. Null unless both match.
    """
    clientSupportTicketStatus(reference: String!, email: String!): ClientTicketStatus
  }

  extend type Mutation {
    "SUPPORT/ADMIN: move a ticket through its lifecycle."
    setSupportTicketStatus(id: ID!, status: SupportStatus!): SupportTicket!
    "SUPPORT/ADMIN: re-triage a ticket — the team it belongs to and how urgent it is."
    setSupportTicketTriage(id: ID!, category: SupportCategory!, priority: SupportPriority!): SupportTicket!
    "SUPPORT/ADMIN: hand a ticket to someone, or pass an empty id to unassign it."
    assignSupportTicket(id: ID!, assigneeId: String!): SupportTicket!
    "SUPPORT/ADMIN: reply on a ticket, or leave an internal note."
    addSupportReply(
      ticketId: ID!
      body: String!
      internal: Boolean!
      attachments: [TicketAttachmentInput!]
    ): SupportReply!
    createSupportSlaPolicy(input: SupportSlaPolicyInput!): SupportSlaPolicy!
    updateSupportSlaPolicy(id: ID!, input: SupportSlaPolicyInput!): SupportSlaPolicy!
    deleteSupportSlaPolicy(id: ID!): Boolean!
    """
    Unauthenticated — anybody who buys from us must be able to ask for help without an
    account. Rate-limited per address; returns only the ticket's reference.
    """
    createClientSupportTicket(input: ClientSupportTicketInput!): String!
  }
`;

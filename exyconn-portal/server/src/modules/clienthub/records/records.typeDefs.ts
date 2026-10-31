import gql from 'graphql-tag';

export const clientRecordsTypeDefs = gql`
  enum ClientCommunicationType {
    CALL
    EMAIL
    MEETING
    MESSAGE
    OTHER
  }

  "A Legal record that can be shared with a client."
  enum ClientSharedKind {
    CONTRACT
    DOCUMENT
    POLICY
  }

  "An important link kept for a client and shown in their client hub."
  type ClientLink {
    id: ID!
    clientId: String!
    title: String!
    url: String!
    description: String!
    details: String!
    createdByName: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input ClientLinkInput {
    title: String!
    url: String!
    description: String
    details: String
    "Email the client's hub contacts about the new link (create only)."
    notify: Boolean
  }

  "A call, email, meeting or message with a client; the client reads the same log."
  type ClientCommunication {
    id: ID!
    clientId: String!
    type: ClientCommunicationType!
    occurredAt: DateTime!
    subject: String!
    summary: String!
    details: String!
    "Who took part, as written by whoever logged it."
    participants: String!
    loggedByName: String!
    "When the client's hub contacts were emailed about it; null when they were not."
    notifiedAt: DateTime
    createdAt: DateTime!
  }

  input ClientCommunicationInput {
    type: ClientCommunicationType!
    occurredAt: DateTime!
    subject: String!
    summary: String
    details: String
    participants: String
    "Email the client's hub contacts about this entry. Sent at most once per entry."
    notify: Boolean
  }

  type ClientCommunicationPage {
    rows: [ClientCommunication!]!
    totalCount: Int!
  }

  "A contract, document or policy shared with a client, read live from Legal."
  type ClientSharedItem {
    id: ID!
    kind: ClientSharedKind!
    refId: String!
    "The record's title now; empty when it was deleted in Legal."
    title: String!
    "The record's own status (a contract's ACTIVE, a policy's PUBLISHED…); REMOVED when deleted."
    status: String!
    "The file to open; empty when there is none."
    fileUrl: String!
    "Whether the record has written text the client hub can show."
    hasContent: Boolean!
    note: String!
    sharedByName: String!
    sharedAt: DateTime!
    notifiedAt: DateTime
    effectiveDate: DateTime
    expiryDate: DateTime
    "Contracts: when the counterparty last signed, and the name they signed with."
    signedAt: DateTime
    signedBy: String
  }

  input ClientShareInput {
    kind: ClientSharedKind!
    refId: ID!
    note: String
    "Email the client's hub contacts. Sent at most once per shared record."
    notify: Boolean
  }

  "A Legal record the share picker offers."
  type ClientShareOption {
    id: ID!
    title: String!
    status: String!
  }

  "An address on file for a client: their own, or a hub contact's."
  type ClientEmailRecipient {
    name: String!
    email: String!
  }

  input EmailClientInput {
    "Addresses from clientEmailRecipients; any other address is refused."
    to: [String!]!
    subject: String!
    message: String!
  }

  "How much sits under each tab of a client's page."
  type ClientSummary {
    contacts: Int!
    invoices: Int!
    openInvoices: Int!
    payments: Int!
    tickets: Int!
    openTickets: Int!
    projects: Int!
    links: Int!
    communications: Int!
    sharedItems: Int!
  }

  extend type Query {
    "Admin > Clients > client: counts for each tab."
    clientSummary(clientId: ID!): ClientSummary!
    "Lists the links saved on a client (Admin > Clients), newest first."
    clientLinks(clientId: ID!): [ClientLink!]!
    "Every client's communication log; filter on clientId for one client."
    listClientCommunicationsPaged(input: TableQueryInput!): ClientCommunicationPage!
    "Lists the Legal records shared with a client, including ones since deleted in Legal (status REMOVED)."
    clientSharedItems(clientId: ID!): [ClientSharedItem!]!
    "Legal records of one kind that may be shared with a client (up to 200, latest first)."
    clientShareOptions(kind: ClientSharedKind!): [ClientShareOption!]!
    "Lists the addresses emailClient may send to: the client's own address, then each active client hub contact."
    clientEmailRecipients(clientId: ID!): [ClientEmailRecipient!]!

    "The signed-in client hub contact's own client's links."
    clientHubLinks: [ClientLink!]!
    "Lists the signed-in contact's client communication log, one page at a time."
    clientHubCommunications(input: TableQueryInput!): ClientCommunicationPage!
    "Lists the Legal records shared with the signed-in contact's client. Records deleted in Legal are left out."
    clientHubSharedItems: [ClientSharedItem!]!
    "A shared record's text as sanitised HTML."
    clientHubSharedContent(id: ID!): String!
  }

  extend type Mutation {
    createClientLink(clientId: ID!, input: ClientLinkInput!): ClientLink!
    updateClientLink(id: ID!, input: ClientLinkInput!): ClientLink!
    deleteClientLink(id: ID!): Boolean!
    createClientCommunication(clientId: ID!, input: ClientCommunicationInput!): ClientCommunication!
    updateClientCommunication(id: ID!, input: ClientCommunicationInput!): ClientCommunication!
    deleteClientCommunication(id: ID!): Boolean!
    "Shares a Legal record with the client; sharing it again only updates the note."
    shareWithClient(clientId: ID!, input: ClientShareInput!): ClientSharedItem!
    "Stops sharing a Legal record with a client, removing it from their client hub. The Legal record itself is kept."
    unshareWithClient(id: ID!): Boolean!
    "Emails the client and files it in their communication log. Returns how many were sent."
    emailClient(clientId: ID!, input: EmailClientInput!): Int!
  }
`;

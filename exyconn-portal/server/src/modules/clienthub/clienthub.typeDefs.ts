import gql from 'graphql-tag';

export const clientHubTypeDefs = gql`
  "A person at a client who may sign in to the client hub with an emailed code."
  type ClientContact {
    id: ID!
    clientId: String!
    name: String!
    email: String!
    active: Boolean!
    lastSignInAt: DateTime
    signInCount: Int!
    createdAt: DateTime!
  }

  input ClientContactInput {
    clientId: ID!
    name: String!
    email: String!
  }

  "A signed-in contact: the client hub pass (send it as x-client-pass) and who they are."
  type ClientHubSignIn {
    token: String!
    name: String!
    email: String!
  }

  type ClientHubMe {
    name: String!
    email: String!
    clientName: String!
    company: String!
  }

  "An unpaid invoice, soonest due first, for the reminders panel."
  type ClientHubReminder {
    invoiceId: ID!
    number: String!
    currency: String!
    balance: Float!
    dueDate: DateTime!
    "Whole days past the due date; 0 when not yet due."
    daysLate: Int!
    status: InvoiceStatus!
  }

  "One of the client's projects, as a share link shows it."
  type ClientHubProject {
    id: ID!
    name: String!
    status: ProjectStatus!
    startDate: DateTime
    endDate: DateTime
    budgetHours: Float
    trackedHours: Float!
    milestones: [SharedMilestone!]!
    ticketCounts: [SharedTicketCount!]!
  }

  enum PaymentGateway {
    STRIPE
    RAZORPAY
  }

  enum PaymentAttemptStatus {
    PENDING
    PAID
    REVIEW
    EXPIRED
  }

  "Which gateways the signed-in client may pay with."
  type ClientHubPaymentOptions {
    stripe: Boolean!
    razorpay: Boolean!
  }

  type ClientHubCheckout {
    attemptId: ID!
    url: String!
  }

  type PaymentAttempt {
    id: ID!
    gateway: PaymentGateway!
    invoiceId: String!
    invoiceNumber: String!
    amount: Float!
    currency: String!
    status: PaymentAttemptStatus!
    paidAt: DateTime
    createdAt: DateTime!
  }

  input ClientHubTicketInput {
    subject: String!
    category: SupportCategory!
    description: String!
    priority: SupportPriority!
  }

  "Exyconn's Stripe account (Tech > Environment Variables). Secrets are write-only."
  type StripeConfig {
    id: ID!
    label: String!
    hasSecretKey: Boolean!
    secretKeyHint: String
    hasWebhookSecret: Boolean!
    webhookSecretHint: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input StripeConfigInput {
    label: String!
    "Left blank on an edit, the stored key is kept."
    secretKey: String
    webhookSecret: String
    isActive: Boolean!
  }

  "Exyconn's Razorpay account (Tech > Environment Variables). Secrets are write-only."
  type RazorpayConfig {
    id: ID!
    label: String!
    keyId: String!
    hasKeySecret: Boolean!
    keySecretHint: String
    hasWebhookSecret: Boolean!
    webhookSecretHint: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input RazorpayConfigInput {
    label: String!
    keyId: String!
    "Left blank on an edit, the stored secret is kept."
    keySecret: String
    webhookSecret: String
    isActive: Boolean!
  }

  extend type Query {
    "Admin > Clients: who at a client has client hub access."
    clientContacts(clientId: ID!): [ClientContact!]!

    "The signed-in client hub contact (pass in x-client-pass)."
    clientHubMe: ClientHubMe!
    clientHubInvoices(input: TableQueryInput!): InvoicePage!
    "The invoice PDF as base64."
    clientHubInvoicePdf(id: ID!): String!
    clientHubPayments(input: TableQueryInput!): PaymentPage!
    clientHubReminders: [ClientHubReminder!]!
    clientHubTickets(input: TableQueryInput!): SupportTicketPage!
    clientHubTicketReplies(ticketId: ID!): [SupportReply!]!
    clientHubProjects: [ClientHubProject!]!
    clientHubPaymentOptions: ClientHubPaymentOptions!
    clientHubPaymentAttempt(id: ID!): PaymentAttempt!

    "Tech > Environment Variables: Exyconn's payment gateway accounts."
    listStripeConfigs: [StripeConfig!]!
    listRazorpayConfigs: [RazorpayConfig!]!
  }

  extend type Mutation {
    "Admin > Clients: gives a person client hub access and emails them where to sign in."
    addClientContact(input: ClientContactInput!): ClientContact!
    "Switching access off signs the person out at once."
    setClientContactActive(id: ID!, active: Boolean!): ClientContact!
    deleteClientContact(id: ID!): Boolean!

    "Public: emails a sign-in code to an address with client hub access (always true)."
    requestClientHubCode(email: String!): Boolean!
    "Public: exchanges the emailed code for a client hub pass."
    verifyClientHubCode(email: String!, code: String!): ClientHubSignIn!

    "Emails the invoice, PDF attached, to the signed-in contact's own address."
    clientHubEmailInvoice(id: ID!): Boolean!
    "Opens the gateway's hosted checkout for the invoice's whole balance."
    clientHubPayInvoice(id: ID!, gateway: PaymentGateway!): ClientHubCheckout!
    clientHubOpenTicket(input: ClientHubTicketInput!): SupportTicket!
    clientHubReplyToTicket(ticketId: ID!, body: String!): SupportReply!

    createStripeConfig(input: StripeConfigInput!): StripeConfig!
    updateStripeConfig(id: ID!, input: StripeConfigInput!): StripeConfig!
    deleteStripeConfig(id: ID!): Boolean!
    testStripeConnection(id: ID!): Boolean!
    createRazorpayConfig(input: RazorpayConfigInput!): RazorpayConfig!
    updateRazorpayConfig(id: ID!, input: RazorpayConfigInput!): RazorpayConfig!
    deleteRazorpayConfig(id: ID!): Boolean!
    testRazorpayConnection(id: ID!): Boolean!
  }
`;

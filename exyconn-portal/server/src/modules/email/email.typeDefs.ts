import gql from 'graphql-tag';

/**
 * The email system: fragments, templates, the send log, and the dashboard over them.
 * SMTP settings stay where they were, in the Tech module's EmailConfig.
 */
export const emailTypeDefs = gql`
  enum EmailLogStatus {
    SENT
    FAILED
  }

  "A reusable piece of MJML, pulled into a template with {{> key }}."
  type EmailFragment {
    id: ID!
    key: String!
    name: String!
    description: String!
    mjml: String!
    updatedBy: String!
    updatedAt: DateTime!
  }

  input EmailFragmentInput {
    key: String!
    name: String!
    description: String
    mjml: String!
  }

  "One transactional email, authored here rather than compiled into the server."
  type EmailTemplate {
    id: ID!
    "What code sends by. Renaming it breaks the caller."
    key: String!
    name: String!
    description: String!
    subject: String!
    mjml: String!
    isActive: Boolean!
    updatedBy: String!
    updatedAt: DateTime!
    """
    The placeholders this template needs, read out of its own markup (and its fragments')
    every time it is asked for — never a stored list, which drifts the moment copy is edited.
    """
    variables: [String!]!
    "The fragments it pulls in."
    fragments: [String!]!
  }

  input EmailTemplateInput {
    key: String!
    name: String!
    description: String
    subject: String!
    mjml: String!
    isActive: Boolean
  }

  "One attempt to send, kept whether it worked or not."
  type EmailLog {
    id: ID!
    templateKey: String!
    templateName: String!
    to: String!
    subject: String!
    status: EmailLogStatus!
    "The transport's own words when it refused. Empty on success."
    error: String!
    triggeredBy: String!
    sentAt: DateTime!
  }

  type EmailFragmentPage {
    rows: [EmailFragment!]!
    totalCount: Int!
  }

  type EmailTemplatePage {
    rows: [EmailTemplate!]!
    totalCount: Int!
  }

  type EmailLogPage {
    rows: [EmailLog!]!
    totalCount: Int!
  }

  "One day of sending, for the dashboard's trend."
  type EmailDayCount {
    date: String!
    sent: Int!
    failed: Int!
  }

  "How much a single template is used, and how reliably."
  type EmailTemplateUsage {
    key: String!
    name: String!
    sent: Int!
    failed: Int!
  }

  type EmailDashboard {
    templates: Int!
    activeTemplates: Int!
    fragments: Int!
    sent: Int!
    failed: Int!
    "Whether an SMTP configuration is active. Nothing sends without one."
    configured: Boolean!
    days: [EmailDayCount!]!
    byTemplate: [EmailTemplateUsage!]!
    recentFailures: [EmailLog!]!
  }

  "A rendered template, as the send path itself produces it."
  type EmailPreview {
    subject: String!
    html: String!
    variables: [String!]!
    fragments: [String!]!
  }

  "One placeholder value, for previewing and test sends."
  input EmailVariableInput {
    name: String!
    value: String!
  }

  extend type Query {
    listEmailFragments: [EmailFragment!]!
    listEmailFragmentsPaged(input: TableQueryInput!): EmailFragmentPage!
    listEmailFragmentsStats: TableStats!
    getEmailFragment(id: ID!): EmailFragment!

    listEmailTemplates: [EmailTemplate!]!
    listEmailTemplatesPaged(input: TableQueryInput!): EmailTemplatePage!
    listEmailTemplatesStats: TableStats!
    getEmailTemplate(id: ID!): EmailTemplate!

    listEmailLogsPaged(input: TableQueryInput!): EmailLogPage!
    listEmailLogsStats: TableStats!

    emailDashboard(days: Int): EmailDashboard!

    "Renders a stored template with the values given, through the very code that sends it."
    previewEmailTemplate(key: String!, variables: [EmailVariableInput!]): EmailPreview!
  }

  extend type Mutation {
    createEmailFragment(input: EmailFragmentInput!): EmailFragment!
    updateEmailFragment(id: ID!, input: EmailFragmentInput!): EmailFragment!
    deleteEmailFragment(id: ID!): Boolean!

    createEmailTemplate(input: EmailTemplateInput!): EmailTemplate!
    updateEmailTemplate(id: ID!, input: EmailTemplateInput!): EmailTemplate!
    deleteEmailTemplate(id: ID!): Boolean!

    "Sends the real thing to one address, and logs it like any other send."
    sendTestEmailTemplate(key: String!, to: String!, variables: [EmailVariableInput!]): Boolean!
  }
`;

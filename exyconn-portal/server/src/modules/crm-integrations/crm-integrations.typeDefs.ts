import gql from 'graphql-tag';

/**
 * CRM > Integrations: the company's own calling and SMS accounts, click-to-call and texting
 * from a contact or company page, and which channels are ready.
 */
export const crmIntegrationsTypeDefs = gql`
  enum CrmCallProvider {
    TWILIO
    VOBIZ
  }

  enum CrmSmsProvider {
    TWILIO
    MSG91
  }

  enum CrmEmailProvider {
    GMAIL
    MICROSOFT
  }

  type CrmChannelStatus {
    "Whether the company has an active account for this channel."
    ready: Boolean!
    "The active account's provider; null when there is none."
    provider: String
  }

  type CrmEmailStatus {
    "A Gmail mailbox is connected and enabled, and this is the operator's CRM."
    gmail: Boolean!
    "A Microsoft mailbox is connected and enabled, and this is the operator's CRM."
    microsoft: Boolean!
  }

  "Which contact actions a record page can offer."
  type CrmIntegrationStatus {
    call: CrmChannelStatus!
    sms: CrmChannelStatus!
    email: CrmEmailStatus!
  }

  "A company's calling account. The auth token never leaves the server."
  type CrmCallConfig {
    id: ID!
    label: String!
    provider: CrmCallProvider!
    "The number calls come from, in E.164."
    fromNumber: String!
    "Twilio Account SID or Vobiz Auth ID."
    accountId: String!
    hasAuthToken: Boolean!
    authTokenHint: String
    isActive: Boolean!
    updatedByName: String!
    createdAt: DateTime
    updatedAt: DateTime
  }

  input CrmCallConfigInput {
    label: String!
    provider: CrmCallProvider!
    "The number calls come from, in E.164, e.g. +14155550100."
    fromNumber: String!
    "Twilio Account SID or Vobiz Auth ID."
    accountId: String!
    "Twilio or Vobiz Auth Token. Blank keeps the stored one when editing."
    authToken: String!
    isActive: Boolean!
  }

  "A company's SMS account. The auth token never leaves the server."
  type CrmSmsConfig {
    id: ID!
    label: String!
    provider: CrmSmsProvider!
    "Twilio: the sending number in E.164."
    fromNumber: String!
    "Twilio: the Account SID."
    accountId: String!
    "MSG91: the DLT sender id."
    senderId: String!
    "MSG91: the DLT-approved flow template id."
    templateId: String!
    "MSG91: the template variable that carries the message."
    messageVariable: String!
    hasAuthToken: Boolean!
    authTokenHint: String
    isActive: Boolean!
    updatedByName: String!
    createdAt: DateTime
    updatedAt: DateTime
  }

  input CrmSmsConfigInput {
    label: String!
    provider: CrmSmsProvider!
    "Twilio only: the sending number in E.164."
    fromNumber: String
    "Twilio only: the Account SID."
    accountId: String
    "Twilio Auth Token or MSG91 auth key. Blank keeps the stored one when editing."
    authToken: String!
    "MSG91 only: the DLT sender id."
    senderId: String
    "MSG91 only: the DLT-approved flow template id."
    templateId: String
    "MSG91 only: the template variable that carries the message, e.g. message."
    messageVariable: String
    isActive: Boolean!
  }

  input StartCrmCallInput {
    object: CrmTimelineObject!
    id: ID!
    "The record's number to call, in E.164."
    to: String!
    "The CRM user's own phone, in E.164: it rings first, then the call is bridged to the record."
    agentPhone: String!
  }

  type CrmCallResult {
    provider: CrmCallProvider!
    "The provider's id for the call."
    callId: String!
    "The provider's status when the call was queued."
    status: String!
    "The CALL activity logged on the record's timeline."
    activityId: ID!
  }

  input SendCrmSmsInput {
    object: CrmTimelineObject!
    id: ID!
    "The record's number to text, in E.164."
    to: String!
    "1 to 1000 characters."
    body: String!
  }

  type CrmSmsResult {
    provider: CrmSmsProvider!
    "The provider's id for the message (MSG91: its request id)."
    messageId: String!
    status: String!
    "The activity logged on the record's timeline."
    activityId: ID!
  }

  "A mailbox a CRM email can be sent from."
  type CrmEmailSenderOption {
    id: ID!
    email: String!
    provider: CrmEmailProvider!
  }

  extend type Query {
    crmIntegrationStatus: CrmIntegrationStatus!
    crmCallConfigs: [CrmCallConfig!]!
    crmSmsConfigs: [CrmSmsConfig!]!
    "Every Gmail and Microsoft mailbox a CRM email may go from; empty outside the operator's CRM."
    crmEmailSenders: [CrmEmailSenderOption!]!
  }

  extend type Mutation {
    createCrmCallConfig(input: CrmCallConfigInput!): CrmCallConfig!
    updateCrmCallConfig(id: ID!, input: CrmCallConfigInput!): CrmCallConfig!
    deleteCrmCallConfig(id: ID!): Boolean!
    "Checks the stored credentials with the provider; places no call."
    testCrmCallConfig(id: ID!): String!
    createCrmSmsConfig(input: CrmSmsConfigInput!): CrmSmsConfig!
    updateCrmSmsConfig(id: ID!, input: CrmSmsConfigInput!): CrmSmsConfig!
    deleteCrmSmsConfig(id: ID!): Boolean!
    "Checks the stored credentials with the provider; sends nothing."
    testCrmSmsConfig(id: ID!): String!
    "Click-to-call: rings the caller's own phone, then bridges to the record's number."
    startCrmCall(input: StartCrmCallInput!): CrmCallResult!
    sendCrmSms(input: SendCrmSmsInput!): CrmSmsResult!
  }
`;

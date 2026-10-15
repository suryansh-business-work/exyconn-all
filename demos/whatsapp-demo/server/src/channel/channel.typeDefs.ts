import gql from 'graphql-tag';

/** The real WhatsApp number's settings, for Tech > Demos > WhatsApp bot. */
export const whatsappChannelTypeDefs = gql`
  type WhatsappChannel {
    id: ID!
    phoneNumberId: String!
    displayPhone: String!
    verifyToken: String!
    enabled: Boolean!
    hasAccessToken: Boolean!
    "The last characters of the stored token, to tell two apart; never the token."
    accessTokenHint: String
    hasAppSecret: Boolean!
    webhookUrl: String!
    "When Meta last delivered a message this server accepted for the number."
    lastInboundAt: String
    "Why the last message or reply did not go through; empty when nothing is wrong."
    lastProblem: String!
    lastProblemAt: String
    updatedAt: String
    updatedByName: String
  }

  type WhatsappChannelSettings {
    "Where the Meta app's webhook has to point."
    webhookUrl: String!
    channel: WhatsappChannel
  }

  input WhatsappChannelInput {
    phoneNumberId: String!
    displayPhone: String!
    "Blank keeps the stored token."
    accessToken: String!
    "Blank keeps the stored secret."
    appSecret: String!
    verifyToken: String!
    enabled: Boolean!
  }

  extend type Query {
    whatsappChannel: WhatsappChannelSettings!
  }

  "What the Test button sends: a blank access token means the saved one."
  input WhatsappChannelTestInput {
    phoneNumberId: String!
    accessToken: String!
  }

  "A stored credential of the number; the values are the field names."
  enum WhatsappChannelSecret {
    accessToken
    appSecret
  }

  extend type Mutation {
    saveWhatsappChannel(input: WhatsappChannelInput!): WhatsappChannel!
    deleteWhatsappChannel: Boolean!
    "Checks the number and token with Meta and subscribes the app to the number's WhatsApp account."
    testWhatsappChannel(input: WhatsappChannelTestInput!): String!
    "One stored credential, in full, for the eye button. Each reveal is audited."
    revealWhatsappChannelSecret(secret: WhatsappChannelSecret!): String!
  }
`;

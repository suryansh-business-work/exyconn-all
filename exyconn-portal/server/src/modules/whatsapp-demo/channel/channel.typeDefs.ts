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

  extend type Mutation {
    saveWhatsappChannel(input: WhatsappChannelInput!): WhatsappChannel!
    deleteWhatsappChannel: Boolean!
    "Reads the number from Meta with the token; resolves to how Meta names it."
    testWhatsappChannel(input: WhatsappChannelTestInput!): String!
  }
`;

import gql from 'graphql-tag';

export const callingBotTypeDefs = gql`
  "The calling bot demo's settings (Tech > Demos > Calling bot). Keys are never listed; see revealCallingBotSecret."
  type CallingBotConfig {
    id: ID!
    label: String!
    "Whether a Sarvam AI key is stored; the key itself is never returned."
    hasSarvamApiKey: Boolean!
    sarvamApiKeyHint: String
    "Whether an OpenAI key is stored; the key itself is never returned."
    hasOpenAiApiKey: Boolean!
    openAiApiKeyHint: String
    "A fast chat model, e.g. gpt-4o-mini."
    openAiModel: String!
    "Who the bot is and how it talks."
    systemPrompt: String!
    "The first thing the bot says."
    greeting: String!
    "The language of the call, e.g. hi-IN."
    languageCode: String!
    "Sarvam text-to-speech model, e.g. bulbul:v2."
    ttsModel: String!
    "Sarvam voice, e.g. anushka."
    ttsSpeaker: String!
    "A call is hung up after this many seconds."
    maxCallSeconds: Int!
    vobizAuthId: String!
    "Whether a Vobiz Auth Token is stored; the token itself is never returned."
    hasVobizAuthToken: Boolean!
    "The number phone calls are placed from, in E.164."
    vobizNumber: String!
    "Whether calls to a real phone can be placed: every Vobiz field is filled in."
    phoneEnabled: Boolean!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  "A stored calling bot key that Tech staff can reveal, one at a time."
  enum CallingBotSecret {
    SARVAM_API_KEY
    OPENAI_API_KEY
    VOBIZ_AUTH_TOKEN
  }

  input CallingBotConfigInput {
    label: String!
    "Write-only. Leave empty when editing to keep the stored key."
    sarvamApiKey: String!
    "Write-only. Leave empty when editing to keep the stored key."
    openAiApiKey: String!
    openAiModel: String!
    systemPrompt: String!
    greeting: String!
    languageCode: String!
    ttsModel: String!
    ttsSpeaker: String!
    maxCallSeconds: Int!
    vobizAuthId: String!
    "Write-only. Leave empty when editing to keep the stored token."
    vobizAuthToken: String!
    vobizNumber: String!
    isActive: Boolean
  }

  "Whether the demo can take a call right now, and to a real phone."
  type CallingBotAvailability {
    available: Boolean!
    phoneEnabled: Boolean!
    languageCode: String
    maxCallSeconds: Int
  }

  enum CallingBotChannel {
    BROWSER
    PHONE
  }

  enum CallingBotCallStatus {
    STARTING
    RINGING
    LIVE
    ENDED
    FAILED
  }

  enum CallingBotTurnRole {
    CALLER
    BOT
  }

  "One thing said on a call."
  type CallingBotTurn {
    role: CallingBotTurnRole!
    text: String!
    at: DateTime!
  }

  "One call with the bot."
  type CallingBotCall {
    id: ID!
    channel: CallingBotChannel!
    status: CallingBotCallStatus!
    callerName: String!
    callerEmail: String!
    "The number a phone call rang; empty for a browser call."
    phone: String!
    languageCode: String!
    answeredAt: DateTime
    endedAt: DateTime
    "Why the call ended."
    endReason: String!
    transcript: [CallingBotTurn!]!
    createdAt: DateTime!
  }

  "A call just asked for. A browser call opens its audio on socketUrl, which works once and briefly."
  type CallingBotCallStart {
    call: CallingBotCall!
    socketUrl: String
  }

  input StartCallingBotCallInput {
    channel: CallingBotChannel!
    "The number to ring, in E.164; phone calls only."
    phone: String
  }

  extend type Query {
    callingBotConfigs: [CallingBotConfig!]!
    "The most recent calls, newest first."
    callingBotRecentCalls(limit: Int): [CallingBotCall!]!
    callingBotAvailability: CallingBotAvailability!
    "One of the caller's own calls, to follow it as it happens."
    callingBotCall(id: ID!): CallingBotCall!
  }

  extend type Mutation {
    createCallingBotConfig(input: CallingBotConfigInput!): CallingBotConfig!
    updateCallingBotConfig(id: ID!, input: CallingBotConfigInput!): CallingBotConfig!
    deleteCallingBotConfig(id: ID!): Boolean!
    "One stored key, in full, for the eye button on the Tech screen. Each reveal is audited."
    revealCallingBotSecret(id: ID!, secret: CallingBotSecret!): String!
    "Checks the OpenAI key and model, and the Sarvam key, language and voice."
    testCallingBotConfig(id: ID!): Boolean!
    startCallingBotCall(input: StartCallingBotCallInput!): CallingBotCallStart!
  }
`;

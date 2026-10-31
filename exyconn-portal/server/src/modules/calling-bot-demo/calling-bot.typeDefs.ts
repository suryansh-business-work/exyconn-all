import gql from 'graphql-tag';

export const callingBotTypeDefs = gql`
  "The calling bot demo's settings (Agents > Calling bot). Keys are never listed; see revealCallingBotSecret."
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
    "Which account rings real phones."
    phoneProvider: CallingBotPhoneProvider!
    vobizAuthId: String!
    "Whether a Vobiz Auth Token is stored; the token itself is never returned."
    hasVobizAuthToken: Boolean!
    "The Vobiz number phone calls are placed from, in E.164."
    vobizNumber: String!
    "The Twilio Account SID (AC...)."
    twilioAccountSid: String!
    "Whether a Twilio Auth Token is stored; the token itself is never returned."
    hasTwilioAuthToken: Boolean!
    "The Twilio number phone calls are placed from, in E.164."
    twilioNumber: String!
    "Whether calls to a real phone can be placed: the chosen provider's every field is filled in."
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
    TWILIO_AUTH_TOKEN
  }

  "Which telephony account places calls to real phones; NONE offers browser calls only."
  enum CallingBotPhoneProvider {
    NONE
    VOBIZ
    TWILIO
  }

  "An account the Tech screen can test on its own."
  enum CallingBotKey {
    SARVAM
    OPENAI
    VOBIZ
    TWILIO
  }

  "What the form holds when a Test button is pressed; a blank key means the saved one."
  input CallingBotKeyTestInput {
    "The config being edited, whose saved keys stand in for blank ones."
    configId: ID
    key: CallingBotKey!
    sarvamApiKey: String
    languageCode: String
    ttsModel: String
    ttsSpeaker: String
    openAiApiKey: String
    openAiModel: String
    vobizAuthId: String
    vobizAuthToken: String
    twilioAccountSid: String
    twilioAuthToken: String
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
    phoneProvider: CallingBotPhoneProvider!
    vobizAuthId: String!
    "Write-only. Leave empty when editing to keep the stored token."
    vobizAuthToken: String!
    vobizNumber: String!
    twilioAccountSid: String!
    "Write-only. Leave empty when editing to keep the stored token."
    twilioAuthToken: String!
    twilioNumber: String!
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
    "The example the caller picked, as titled when the call was made; null for none."
    scenarioTitle: String
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
    "The example the bot plays (from callingBotScenarios); none keeps the bot's own prompt."
    scenarioId: ID
  }

  "An example call the bot can play (Agents > Calling bot > Examples)."
  type CallingBotScenario {
    id: ID!
    title: String!
    "One line for the visitor: who the bot is and what to try."
    description: String!
    "Who the bot is on this call: the system prompt."
    systemPrompt: String!
    "The first thing the bot says."
    greeting: String!
    "e.g. hi-IN; empty keeps the active config's language."
    languageCode: String!
    "Only enabled examples are offered on the demo."
    enabled: Boolean!
    "Where it sits in the demo's list, smallest first."
    order: Int!
    "The call flow drawn in Tech (a wa-flow graph of voice steps); null when it has none."
    flow: JSON
    "The flow as the step-by-step script the voice model follows; empty without a flow."
    callScript: String!
    updatedAt: DateTime!
  }

  "What the demo shows of an example: the prompt stays with Tech."
  type CallingBotScenarioOption {
    id: ID!
    title: String!
    description: String!
    languageCode: String!
  }

  input CallingBotScenarioInput {
    title: String!
    description: String!
    systemPrompt: String!
    greeting: String!
    "Empty keeps the active config's language."
    languageCode: String!
    enabled: Boolean!
    order: Int!
  }

  extend type Query {
    callingBotConfigs: [CallingBotConfig!]!
    "The most recent calls, newest first."
    callingBotRecentCalls(limit: Int): [CallingBotCall!]!
    "Tells whether the calling bot is set up right now, whether it can ring phones, and its language and call length limit."
    callingBotAvailability: CallingBotAvailability!
    "One of the caller's own calls, to follow it as it happens."
    callingBotCall(id: ID!): CallingBotCall!
    "Every example call, for Tech."
    callingBotScenarios: [CallingBotScenario!]!
    "The examples a caller can pick on the demo, in order."
    callingBotScenarioOptions: [CallingBotScenarioOption!]!
  }

  extend type Mutation {
    createCallingBotConfig(input: CallingBotConfigInput!): CallingBotConfig!
    updateCallingBotConfig(id: ID!, input: CallingBotConfigInput!): CallingBotConfig!
    deleteCallingBotConfig(id: ID!): Boolean!
    "One stored key, in full, for the eye button on the Tech screen. Each reveal is audited."
    revealCallingBotSecret(id: ID!, secret: CallingBotSecret!): String!
    "Tests one account from the form; resolves to what worked, or fails saying what did not."
    testCallingBotKey(input: CallingBotKeyTestInput!): String!
    "Checks the OpenAI key and model, and the Sarvam key, language and voice."
    testCallingBotConfig(id: ID!): Boolean!
    "Starts a call with the demo bot: returns a socket address for a browser call, or rings the given phone number. Rate limited; confirm the number with the person before a phone call."
    startCallingBotCall(input: StartCallingBotCallInput!): CallingBotCallStart!
    createCallingBotScenario(input: CallingBotScenarioInput!): CallingBotScenario!
    updateCallingBotScenario(id: ID!, input: CallingBotScenarioInput!): CallingBotScenario!
    deleteCallingBotScenario(id: ID!): Boolean!
    "Saves an example's call flow (checked: voice steps only, no errors) and its script; null removes it."
    saveCallingBotScenarioFlow(id: ID!, flow: JSON): CallingBotScenario!
  }
`;

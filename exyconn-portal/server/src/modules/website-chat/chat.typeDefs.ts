import gql from 'graphql-tag';

export const websiteChatTypeDefs = gql`
  "The public site a website chat was started on."
  enum WebsiteChatSite {
    WEBSITE
    TOOLS
  }

  enum WebsiteChatStatus {
    OPEN
    CLOSED
  }

  "The two threads of a chat: the team answering, and the knowledge bot answering."
  enum WebsiteChatChannel {
    LIVE
    KNOWLEDGE
  }

  "Who wrote a chat message. SYSTEM is the chat itself (welcome, handoff and offline notices)."
  enum WebsiteChatSender {
    VISITOR
    AGENT
    BOT
    SYSTEM
  }

  enum WebsiteChatAttachmentKind {
    IMAGE
    VIDEO
    AUDIO
  }

  enum WebsiteChatKnowledgeSource {
    "Read from exyconn.com by the last sync."
    WEBSITE
    "Written by the website team."
    CUSTOM
  }

  type WebsiteChatAttachment {
    url: String!
    name: String!
    kind: WebsiteChatAttachmentKind!
    "Size in bytes."
    size: Int!
  }

  "A conversation with a visitor of exyconn.com or tools.exyconn.com, opened after their email was verified."
  type WebsiteChatSession {
    id: ID!
    name: String!
    email: String!
    phone: String!
    site: WebsiteChatSite!
    pageUrl: String!
    status: WebsiteChatStatus!
    "The support ticket the chat opened."
    ticketId: String!
    ticketReference: String!
    assigneeId: String!
    assigneeName: String!
    lastMessageAt: DateTime
    lastMessagePreview: String!
    lastSender: String!
    "Live-thread visitor messages nobody on the team has read."
    staffUnread: Int!
    messageCount: Int!
    "Set while a visitor waits for a person; the handoff moves the question to the bot when it is too old."
    awaitingReplySince: DateTime
    handedOffAt: DateTime
    closedAt: DateTime
    closedBy: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WebsiteChatSessionPage {
    rows: [WebsiteChatSession!]!
    totalCount: Int!
  }

  type WebsiteChatMessage {
    id: ID!
    sessionId: ID!
    channel: WebsiteChatChannel!
    sender: WebsiteChatSender!
    senderName: String!
    body: String!
    attachments: [WebsiteChatAttachment!]!
    createdAt: DateTime!
    readAt: DateTime
  }

  "One weekday's opening hours. day is 0 (Sunday) to 6; times are 24-hour HH:mm in the settings' timezone."
  type WebsiteChatDay {
    day: Int!
    enabled: Boolean!
    start: String!
    end: String!
  }

  input WebsiteChatDayInput {
    day: Int!
    enabled: Boolean!
    start: String!
    end: String!
  }

  type WebsiteChatSettings {
    enabled: Boolean!
    botName: String!
    welcomeMessage: String!
    offlineMessage: String!
    handoffMessage: String!
    refusalMessage: String!
    customInstructions: String!
    timezone: String!
    weeklyHours: [WebsiteChatDay!]!
    noReplyTimeoutSeconds: Int!
    botModel: String!
    "How many characters of knowledge go to the bot with each question."
    maxContextChars: Int!
    allowUploads: Boolean!
    maxUploadMb: Int!
    soundEnabledByDefault: Boolean!
    transcriptOnClose: Boolean!
    "Whether the team is on duty right now, by the opening hours."
    online: Boolean!
    knowledgeSyncedAt: DateTime
    knowledgeSyncCount: Int!
    knowledgeSyncError: String!
    updatedAt: DateTime!
  }

  input WebsiteChatSettingsInput {
    enabled: Boolean!
    botName: String!
    welcomeMessage: String!
    offlineMessage: String!
    handoffMessage: String!
    refusalMessage: String!
    customInstructions: String!
    timezone: String!
    weeklyHours: [WebsiteChatDayInput!]!
    noReplyTimeoutSeconds: Int!
    botModel: String!
    maxContextChars: Int!
    allowUploads: Boolean!
    maxUploadMb: Int!
    soundEnabledByDefault: Boolean!
    transcriptOnClose: Boolean!
  }

  "A question and answer in the chat widget's FAQs tab."
  type WebsiteChatFaq {
    id: ID!
    question: String!
    answer: String!
    sortOrder: Int!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input WebsiteChatFaqInput {
    question: String!
    answer: String!
    sortOrder: Int!
    isActive: Boolean!
  }

  type WebsiteChatFaqPage {
    rows: [WebsiteChatFaq!]!
    totalCount: Int!
  }

  "Something the knowledge bot may answer from."
  type WebsiteChatKnowledge {
    id: ID!
    title: String!
    url: String!
    content: String!
    source: WebsiteChatKnowledgeSource!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input WebsiteChatKnowledgeInput {
    title: String!
    url: String
    content: String!
    isActive: Boolean!
  }

  type WebsiteChatKnowledgePage {
    rows: [WebsiteChatKnowledge!]!
    totalCount: Int!
  }

  type WebsiteChatSyncResult {
    count: Int!
    syncedAt: DateTime!
  }

  extend type Query {
    "Website > Chatbot > Sessions (website staff)."
    websiteChatSessionsPaged(input: TableQueryInput!): WebsiteChatSessionPage!
    "Website > Chatbot > Sessions: totals by status and site."
    websiteChatSessionStats: TableStats!
    websiteChatSession(id: ID!): WebsiteChatSession!
    "Both threads of one chat, oldest first."
    websiteChatMessages(sessionId: ID!): [WebsiteChatMessage!]!
    websiteChatSettings: WebsiteChatSettings!
  }

  extend type Mutation {
    updateWebsiteChatSettings(input: WebsiteChatSettingsInput!): WebsiteChatSettings!
    "Takes the chat: it is shown as yours to answer."
    claimWebsiteChatSession(id: ID!): WebsiteChatSession!
    "Ends the chat; the visitor is emailed the conversation when the settings say so."
    closeWebsiteChatSession(id: ID!): WebsiteChatSession!
    deleteWebsiteChatSession(id: ID!): Boolean!
    "Re-reads exyconn.com (pages, blog posts, case studies) into the knowledge bot."
    syncWebsiteChatKnowledge: WebsiteChatSyncResult!
  }
`;

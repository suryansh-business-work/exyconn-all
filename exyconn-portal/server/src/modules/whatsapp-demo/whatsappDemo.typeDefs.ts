import gql from 'graphql-tag';

/**
 * The WhatsApp Business demo: industry demos, their conversation workflows (a draft being
 * edited and the published snapshot the chat runs), the chat's analytics events and the AI
 * parse the chat asks for when a customer types free text. The chat reads and writes as any
 * signed-in employee; everything else is the administrators'.
 */
export const whatsappDemoTypeDefs = gql`
  enum WhatsappWorkflowStatus {
    DRAFT
    PUBLISHED
  }

  "One industry demo: the business the chat pretends to be."
  type WhatsappDemo {
    id: ID!
    key: String!
    industry: String!
    "BusinessProfile, as businessSchema in @exyconn/wa-flow describes it."
    business: JSON!
    greeting: String!
    menuText: String!
    menuButton: String!
    order: Int!
    active: Boolean!
    updatedAt: String!
  }

  type WhatsappWorkflow {
    id: ID!
    demoId: ID!
    demoKey: String!
    key: String!
    name: String!
    description: String!
    keywords: [String!]!
    order: Int!
    "DRAFT when never published or when the draft differs from what is published."
    status: WhatsappWorkflowStatus!
    "The published version; 0 until the first publish."
    version: Int!
    "The graph being edited."
    draft: JSON!
    "The graph the chat runs; null until the first publish."
    published: JSON
    publishedAt: String
    updatedAt: String!
    updatedByName: String
  }

  type WhatsappPublishedWorkflow {
    key: String!
    name: String!
    description: String!
    keywords: [String!]!
    order: Int!
    version: Int!
    "The published graph."
    graph: JSON!
  }

  type WhatsappDemoBundle {
    demo: WhatsappDemo!
    "Published workflows only, in menu order."
    workflows: [WhatsappPublishedWorkflow!]!
    "Changes whenever the demo or any of its published workflows changes."
    revision: String!
  }

  type WhatsappAiStatus {
    configured: Boolean!
    model: String
  }

  input WhatsappAiIntentInput {
    id: String!
    description: String!
  }

  input WhatsappAiEntityInput {
    name: String!
    kind: String!
    description: String!
  }

  input WhatsappDemoParseInput {
    sessionId: ID!
    demoKey: String!
    "A workflow key, or $router for the menu."
    workflow: String!
    node: String!
    "At most 500 characters are read."
    text: String!
    intents: [WhatsappAiIntentInput!]!
    entities: [WhatsappAiEntityInput!]!
  }

  type WhatsappDemoParseResult {
    "False when AI is not configured, timed out, was rate limited or answered badly."
    ok: Boolean!
    "One of the given intent ids, or null."
    intent: String
    "Entity name to value, only for the names asked for; date and time kinds add nameMs."
    entities: JSON!
    latencyMs: Int!
    "NOT_CONFIGURED, TIMEOUT, RATE_LIMITED or FAILED."
    error: String
  }

  enum WhatsappDemoEventType {
    SESSION_START
    SESSION_END
    DEMO_OPENED
    FLOW_STARTED
    FLOW_COMPLETED
    FLOW_ABANDONED
    STEP
    REMINDER_DELIVERED
    DOCUMENT_OPENED
    QR_OPENED
    CHAT_CLEARED
    AI_CALL
  }

  input WhatsappDemoEventInput {
    "Client-generated UUID; a repeated id is ignored."
    id: ID!
    "Client-generated UUID per tab session."
    sessionId: ID!
    type: WhatsappDemoEventType!
    "ISO time on the client clock."
    at: String!
    demoKey: String
    workflow: String
    node: String
    "choice or text."
    stepKind: String
    "Option title or input kind; cut to 80 characters."
    label: String
    "phone, tablet or desktop (SESSION_START)."
    device: String
    "Width x height (SESSION_START)."
    viewport: String
    durationMs: Int
  }

  type WhatsappCount {
    key: String!
    label: String!
    count: Int!
  }

  type WhatsappDayPoint {
    date: String!
    sessions: Int!
    flowsStarted: Int!
    flowsCompleted: Int!
  }

  type WhatsappFlowStat {
    demoKey: String!
    workflow: String!
    name: String!
    started: Int!
    completed: Int!
    abandoned: Int!
  }

  type WhatsappAiStats {
    calls: Int!
    failures: Int!
    avgLatencyMs: Int!
    tokens: Int!
  }

  type WhatsappDemoStats {
    sessions: Int!
    uniqueUsers: Int!
    flowsStarted: Int!
    flowsCompleted: Int!
    "0 to 1."
    completionRate: Float!
    avgSessionMs: Int!
    "By DEMO_OPENED events."
    topDemos: [WhatsappCount!]!
    devices: [WhatsappCount!]!
    "One point per day in the range, zero-filled."
    daily: [WhatsappDayPoint!]!
    flows: [WhatsappFlowStat!]!
    ai: WhatsappAiStats!
  }

  "Distinct sessions reaching one node, in order of first reach."
  type WhatsappFunnelStep {
    node: String!
    label: String!
    sessions: Int!
  }

  type WhatsappDemoSession {
    id: ID!
    sessionId: ID!
    userId: ID!
    userName: String!
    userEmail: String!
    startedAt: String!
    lastEventAt: String!
    durationMs: Int!
    device: String
    viewport: String
    demos: [String!]!
    flowsStarted: Int!
    flowsCompleted: Int!
    events: Int!
    "active when an event arrived in the last 30 minutes, otherwise ended."
    status: String!
  }

  type WhatsappDemoSessionPage {
    rows: [WhatsappDemoSession!]!
    totalCount: Int!
  }

  type WhatsappDemoEvent {
    id: ID!
    type: WhatsappDemoEventType!
    at: String!
    demoKey: String
    workflow: String
    node: String
    stepKind: String
    label: String
    durationMs: Int
    "AI_CALL only: ok, latencyMs, tokens, error and intent."
    meta: JSON
  }

  type WhatsappDemoSessionDetail {
    session: WhatsappDemoSession!
    events: [WhatsappDemoEvent!]!
  }

  input WhatsappDemoInput {
    key: String!
    industry: String!
    business: JSON!
    greeting: String!
    menuText: String!
    menuButton: String!
    order: Int!
    active: Boolean!
  }

  input WhatsappWorkflowCreateInput {
    demoId: ID!
    key: String!
    name: String!
    description: String!
    keywords: [String!]!
    order: Int
  }

  input WhatsappWorkflowDraftInput {
    name: String!
    description: String!
    keywords: [String!]!
    order: Int!
    graph: JSON!
  }

  extend type Query {
    "Every active demo with its published workflows, for the chat."
    whatsappDemoCatalog: [WhatsappDemoBundle!]!
    whatsappDemoAiStatus: WhatsappAiStatus!
    whatsappDemos: [WhatsappDemo!]!
    whatsappWorkflows(demoId: ID): [WhatsappWorkflow!]!
    whatsappWorkflow(id: ID!): WhatsappWorkflow
    whatsappDemoStats(from: String!, to: String!): WhatsappDemoStats!
    whatsappDemoFunnel(
      demoKey: String!
      workflow: String!
      from: String!
      to: String!
    ): [WhatsappFunnelStep!]!
    whatsappDemoSessions(
      input: TableQueryInput!
      from: String
      to: String
    ): WhatsappDemoSessionPage!
    whatsappDemoSession(sessionId: ID!): WhatsappDemoSessionDetail
  }

  extend type Mutation {
    "At most 100 events per call; returns how many were newly stored."
    recordWhatsappDemoEvents(events: [WhatsappDemoEventInput!]!): Int!
    whatsappDemoParse(input: WhatsappDemoParseInput!): WhatsappDemoParseResult!
    upsertWhatsappDemo(id: ID, input: WhatsappDemoInput!): WhatsappDemo!
    createWhatsappWorkflow(input: WhatsappWorkflowCreateInput!): WhatsappWorkflow!
    saveWhatsappWorkflowDraft(id: ID!, input: WhatsappWorkflowDraftInput!): WhatsappWorkflow!
    "Refused with the issues listed when the draft has errors."
    publishWhatsappWorkflow(id: ID!): WhatsappWorkflow!
    "Puts the published graph back into the draft."
    discardWhatsappWorkflowDraft(id: ID!): WhatsappWorkflow!
    "Copies a workflow as a never-published draft keyed key-copy."
    duplicateWhatsappWorkflow(id: ID!): WhatsappWorkflow!
    deleteWhatsappWorkflow(id: ID!): Boolean!
  }
`;

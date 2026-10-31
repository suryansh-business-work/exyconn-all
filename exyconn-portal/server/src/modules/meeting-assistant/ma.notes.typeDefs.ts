import gql from 'graphql-tag';

/** AI notes, decisions, the action checklist, follow-up and summary email. */
export const maNotesTypeDefs = gql`
  enum MaSummaryStyle {
    SHORT
    DETAILED
    EXECUTIVE
    TECHNICAL
    SALES
    CLIENT
    STANDUP
    PROJECT_REVIEW
  }

  enum MaActionStatus {
    PENDING
    IN_PROGRESS
    BLOCKED
    COMPLETED
    CANCELLED
  }

  enum MaPriority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum MaDeliveryStatus {
    PENDING
    SENT
    FAILED
  }

  type MaNotesContent {
    overview: String!
    executiveSummary: String!
    agenda: [String!]!
    discussionPoints: [String!]!
    risks: [String!]!
    blockers: [String!]!
    openQuestions: [String!]!
    followUps: [String!]!
    nextTopics: [String!]!
  }

  input MaNotesContentInput {
    overview: String!
    executiveSummary: String!
    agenda: [String!]!
    discussionPoints: [String!]!
    risks: [String!]!
    blockers: [String!]!
    openQuestions: [String!]!
    followUps: [String!]!
    nextTopics: [String!]!
  }

  type MaNotesRevision {
    version: Int!
    byName: String!
    at: DateTime!
    content: MaNotesContent!
  }

  "A meeting's notes: original is exactly what the model returned; content is the current version."
  type MaNotes {
    id: ID!
    meetingId: String!
    version: Int!
    style: MaSummaryStyle!
    model: String!
    generatedAt: DateTime!
    edited: Boolean!
    original: MaNotesContent!
    content: MaNotesContent!
    revisions: [MaNotesRevision!]!
    promptTokens: Int!
    completionTokens: Int!
    costUsd: Float!
    updatedAt: DateTime!
  }

  "The transcript line that supports an extracted item."
  type MaEvidence {
    segmentId: String!
    quote: String!
    startMs: Int!
    speakerLabel: String
  }

  type MaDecision {
    id: ID!
    meetingId: String!
    text: String!
    evidence: [MaEvidence!]!
    confidence: Float!
    createdAt: DateTime!
  }

  type MaComment {
    id: ID!
    byName: String!
    text: String!
    createdAt: DateTime!
  }

  type MaActionHistory {
    at: DateTime!
    byName: String!
    field: String!
    from: String!
    to: String!
  }

  "A checklist item. needsConfirmation is set while an AI-suggested owner or deadline is unconfirmed."
  type MaActionItem {
    id: ID!
    meetingId: String!
    meetingTitle: String!
    title: String!
    description: String!
    assignedTo: String
    assignedUserId: String
    assignedEmail: String
    dueDate: DateTime
    dueText: String
    priority: MaPriority!
    status: MaActionStatus!
    sourceTimestampMs: Int
    evidence: [MaEvidence!]!
    confidence: Float
    aiGenerated: Boolean!
    needsConfirmation: Boolean!
    overdue: Boolean!
    completedAt: DateTime
    createdByName: String!
    updatedByName: String!
    comments: [MaComment!]!
    history: [MaActionHistory!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MaActionItemPage {
    rows: [MaActionItem!]!
    totalCount: Int!
  }

  type MaActionStats {
    total: Int!
    pending: Int!
    inProgress: Int!
    blocked: Int!
    completed: Int!
    cancelled: Int!
    overdue: Int!
    needsConfirmation: Int!
  }

  input MaActionItemInput {
    title: String!
    description: String!
    assignedTo: String
    assignedUserId: String
    dueDate: DateTime
    priority: MaPriority!
    status: MaActionStatus!
  }

  input MaBulkActionInput {
    ids: [ID!]!
    status: MaActionStatus
    priority: MaPriority
  }

  "What the next meeting in a series should remember from the earlier ones."
  type MaFollowUp {
    previousMeeting: MaMeeting
    previousSummary: String
    previousDecisions: [MaDecision!]!
    pendingActions: [MaActionItem!]!
    completedActions: [MaActionItem!]!
    overdueActions: [MaActionItem!]!
    unresolvedBlockers: [String!]!
    carriedTopics: [String!]!
  }

  type MaEmailDelivery {
    id: ID!
    notesVersion: Int!
    recipient: String!
    status: MaDeliveryStatus!
    attempts: Int!
    error: String!
    sentAt: DateTime
    triggeredByName: String!
    createdAt: DateTime!
  }

  type MaEmailPreview {
    subject: String!
    html: String!
    recipients: [String!]!
  }

  extend type Query {
    "Reads the AI-written notes of a meeting (summary, topics, blockers, next steps) with their version, or null if none yet."
    maNotes(meetingId: ID!): MaNotes
    "Lists the decisions recorded in a meeting, oldest first."
    maDecisions(meetingId: ID!): [MaDecision!]!
    "Lists meeting action items one page at a time, for one meeting or across the caller's (or the company's) meetings."
    maActionItemsPaged(
      input: TableQueryInput!
      "MINE (default) for meetings the caller can see as a participant or owner; ALL for the whole company, which needs company view permission."
      scope: MaScope
      "Limits the result to one meeting; scope is then ignored."
      meetingId: ID
    ): MaActionItemPage!
    "Counts action items by status, plus overdue and needing confirmation, for one meeting or across meetings."
    maActionStats(
      "MINE (default) for meetings the caller can see as a participant or owner; ALL for the whole company, which needs company view permission."
      scope: MaScope
      "Limits the result to one meeting; scope is then ignored."
      meetingId: ID
    ): MaActionStats!
    "Reads what carries over into this meeting from the previous one in its series: summary, decisions, open and overdue actions, blockers and topics."
    maFollowUp(meetingId: ID!): MaFollowUp!
    "Lists the summary emails sent for a meeting, one per recipient and notes version, newest first (up to 200)."
    maEmailDeliveries(meetingId: ID!): [MaEmailDelivery!]!
    "Renders the summary email for a meeting without sending it: subject, HTML and recipients."
    maEmailPreview(meetingId: ID!): MaEmailPreview!
  }

  extend type Mutation {
    "Queues a fresh analysis. Existing actions keep their ids, statuses and every edit."
    maRegenerateNotes(meetingId: ID!, style: MaSummaryStyle!): MaMeeting!
    "Saves edited notes. expectedVersion must match, so two editors never overwrite each other."
    maUpdateNotes(meetingId: ID!, content: MaNotesContentInput!, expectedVersion: Int!): MaNotes!
    "Adds an action item to a meeting the caller may edit."
    maCreateActionItem(meetingId: ID!, input: MaActionItemInput!): MaActionItem!
    "Replaces an action item's title, description, assignee, due date, priority and status."
    maUpdateActionItem(id: ID!, input: MaActionItemInput!): MaActionItem!
    "Changes only the status of an action item."
    maSetActionStatus(id: ID!, status: MaActionStatus!): MaActionItem!
    "Sets the status and/or priority of up to 200 action items at once; returns how many were updated."
    maBulkUpdateActionItems(input: MaBulkActionInput!): Int!
    "Permanently deletes an action item. Confirm with the person first."
    maDeleteActionItem(id: ID!): Boolean!
    "Adds a comment to an action item and returns the item."
    maAddActionComment(id: ID!, "The comment text." text: String!): MaActionItem!
    "Sends (or approves sending) the summary of the current notes version, once per recipient."
    maSendSummaryEmail(meetingId: ID!): MaMeeting!
    "Sends a failed summary email to its recipient again. Confirm with the person first."
    maRetryEmailDelivery(id: ID!): MaEmailDelivery!
  }
`;

import gql from 'graphql-tag';

/**
 * CRM > Mail: the conversations of the company's connected Gmail mailboxes, in folders, with
 * reading, searching, marking and trashing. Sending goes through sendCrmEmail.
 */
export const crmMailTypeDefs = gql`
  enum CrmMailFolder {
    INBOX
    SENT
    STARRED
    "Everything except spam and trash."
    ALL
  }

  enum CrmMailAction {
    MARK_READ
    MARK_UNREAD
    STAR
    UNSTAR
    ARCHIVE
    "Moves the conversation to Gmail's trash, where Gmail keeps it for 30 days."
    TRASH
  }

  "A mailbox turned on for the CRM, as CRM > Mail lists it."
  type CrmMailbox {
    id: ID!
    email: String!
    provider: CrmEmailProvider!
    "Whether CRM > Mail can read it: a connected Gmail mailbox. Microsoft mailboxes only send."
    readable: Boolean!
    status: GmailAccountStatus!
    "Why the last call to the provider failed; empty when it worked."
    lastError: String!
    "When CRM > Mail last read its folders; null until then."
    lastSyncedAt: DateTime
    "Unread conversations in its inbox."
    unreadCount: Int!
  }

  type CrmMailFolderCount {
    folder: CrmMailFolder!
    unread: Int!
  }

  type CrmMailOverview {
    mailboxes: [CrmMailbox!]!
    "Unread conversations per folder, across the chosen mailbox or every readable one."
    folders: [CrmMailFolderCount!]!
  }

  "The CRM contact or company a conversation is with, matched by address or domain."
  type CrmMailRecordLink {
    object: CrmTimelineObject!
    id: ID!
    name: String!
  }

  type CrmMailThreadSummary {
    "The mailbox and Gmail thread id, joined by a colon."
    id: ID!
    accountId: ID!
    mailbox: String!
    threadId: String!
    subject: String!
    "The newest message's preview, as plain text."
    snippet: String!
    fromName: String!
    fromAddress: String!
    participants: [String!]!
    lastAt: DateTime!
    messageCount: Int!
    unread: Boolean!
    starred: Boolean!
    hasAttachments: Boolean!
    record: CrmMailRecordLink
  }

  type CrmMailThreadPage {
    rows: [CrmMailThreadSummary!]!
    totalCount: Int!
    "Mailboxes Gmail's own search could not reach, and why; the list still shows what it has."
    warnings: [String!]!
  }

  input CrmMailThreadsInput {
    "One mailbox; every readable one when empty."
    accountId: ID
    folder: CrmMailFolder!
    "Matches subject, preview and people, and Gmail's own search of each mailbox."
    search: String
    "Zero-based."
    page: Int!
    pageSize: Int!
  }

  type CrmMailAttachment {
    id: ID!
    messageId: String!
    filename: String!
    mimeType: String!
    size: Int!
  }

  type CrmMailMessage {
    "Gmail's message id."
    id: ID!
    "The RFC 5322 Message-ID a reply answers."
    messageId: String!
    fromName: String!
    fromAddress: String!
    to: [String!]!
    cc: [String!]!
    bcc: [String!]!
    subject: String!
    sentAt: DateTime!
    direction: CrmEmailDirection!
    "The HTML body, already cleaned by the portal's sanitizer; empty for a plain-text message."
    html: String!
    text: String!
    unread: Boolean!
    attachments: [CrmMailAttachment!]!
  }

  type CrmMailThread {
    id: ID!
    accountId: ID!
    mailbox: String!
    threadId: String!
    subject: String!
    unread: Boolean!
    starred: Boolean!
    "Whether it is in the inbox (not archived)."
    inbox: Boolean!
    record: CrmMailRecordLink
    messages: [CrmMailMessage!]!
  }

  type CrmMailAttachmentFile {
    "The file's bytes, base64-encoded."
    data: String!
    size: Int!
  }

  input CrmMailThreadRef {
    accountId: ID!
    threadId: String!
  }

  type CrmMailSyncResult {
    accountId: ID!
    email: String!
    syncedAt: DateTime
    "Why the sync failed and what to do; empty when it worked."
    error: String!
    "It synced moments ago, so this request left it alone."
    skipped: Boolean!
  }

  extend type Query {
    crmMailOverview(accountId: ID): CrmMailOverview!
    crmMailThreads(input: CrmMailThreadsInput!): CrmMailThreadPage!
    "One conversation with every message, read from Gmail now."
    crmMailThread(accountId: ID!, threadId: String!): CrmMailThread!
    "One attachment of a message, up to 15 MB."
    crmMailAttachment(
      accountId: ID!
      messageId: String!
      attachmentId: String!
    ): CrmMailAttachmentFile!
  }

  extend type Mutation {
    "Reads the newest mail of one mailbox, or of every readable one, from Gmail."
    syncCrmMail(accountId: ID): [CrmMailSyncResult!]!
    "Applies the action in Gmail to every conversation given; returns how many changed."
    crmMailThreadAction(threads: [CrmMailThreadRef!]!, action: CrmMailAction!): Int!
  }
`;

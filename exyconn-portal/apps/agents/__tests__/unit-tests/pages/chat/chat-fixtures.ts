import {
  WebsiteChatChannel,
  WebsiteChatKnowledgeSource,
  WebsiteChatSender,
  WebsiteChatSite,
  WebsiteChatStatus,
  type WebsiteChatFaqFieldsFragment,
  type WebsiteChatKnowledgeFieldsFragment,
  type WebsiteChatSettingsFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { ChatMessage, ChatSession } from '../../../../src/pages/chat/socket/chatSocket.types';

/** A visitor's message in the live thread of chat s1. */
export function chatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    sessionId: 's1',
    channel: WebsiteChatChannel.Live,
    sender: WebsiteChatSender.Visitor,
    senderName: 'Asha',
    body: 'Hello',
    suggestions: [],
    feedback: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    readAt: null,
    attachments: [],
    sources: [],
    ...overrides,
  };
}

/** An open, unassigned chat with Asha Rao started on exyconn.com. */
export function chatSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    id: 's1',
    name: 'Asha Rao',
    email: 'asha@example.com',
    phone: '+91 98765 43210',
    site: WebsiteChatSite.Website,
    pageUrl: 'https://exyconn.com/pricing',
    status: WebsiteChatStatus.Open,
    ticketId: 't1',
    ticketReference: 'TCK-12',
    assigneeId: '',
    assigneeName: '',
    lastMessageAt: null,
    lastMessagePreview: '',
    lastSender: '',
    staffUnread: 0,
    messageCount: 0,
    awaitingReplySince: null,
    handedOffAt: null,
    assignedAt: null,
    expiresAt: null,
    slackLinked: false,
    closedAt: null,
    closedBy: '',
    createdAt: '2026-10-01T09:59:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

export function faqRow(
  overrides: Partial<WebsiteChatFaqFieldsFragment> = {},
): WebsiteChatFaqFieldsFragment {
  return {
    id: 'faq-1',
    question: 'Do you build AI agents?',
    answer: 'Yes, for sales, support and operations.',
    sortOrder: 2,
    isActive: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
    ...overrides,
  };
}

export function knowledgeRow(
  overrides: Partial<WebsiteChatKnowledgeFieldsFragment> = {},
): WebsiteChatKnowledgeFieldsFragment {
  return {
    id: 'kn-1',
    title: 'Pricing',
    url: 'https://exyconn.com/pricing',
    content: 'Projects start at a fixed monthly fee.',
    source: WebsiteChatKnowledgeSource.Custom,
    isActive: true,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
    ...overrides,
  };
}

const DAY_NUMBERS = [3, 0, 6, 1, 5, 2, 4];

/** Saved chatbot settings; the weekly hours arrive out of order, as the server may send them. */
export function settingsRow(
  overrides: Partial<WebsiteChatSettingsFieldsFragment> = {},
): WebsiteChatSettingsFieldsFragment {
  return {
    __typename: 'WebsiteChatSettings',
    enabled: true,
    botName: 'Exy',
    welcomeMessage: 'Hi! How can we help?',
    offlineMessage: 'We are away right now.',
    handoffMessage: 'The bot will take it from here.',
    refusalMessage: 'I can only talk about Exyconn.',
    customInstructions: 'Friendly, short answers.',
    timezone: 'Asia/Kolkata',
    noReplyTimeoutSeconds: 120,
    botModel: 'gpt-4o',
    maxContextChars: 12000,
    allowUploads: true,
    maxUploadMb: 5,
    soundEnabledByDefault: false,
    transcriptOnClose: true,
    sessionTimeoutMinutes: 30,
    embeddingModel: 'text-embedding-3-small',
    agentIds: ['agent-1'],
    slackEnabled: false,
    online: true,
    knowledgeSyncedAt: null,
    knowledgeSyncCount: 0,
    knowledgeSyncError: '',
    updatedAt: '2026-09-02T10:00:00.000Z',
    weeklyHours: DAY_NUMBERS.map((day) => ({
      __typename: 'WebsiteChatDay' as const,
      day,
      enabled: day !== 0,
      start: '09:00',
      end: '18:00',
    })),
    ...overrides,
  };
}

/** Table stats the way the stats queries return them. */
export function tableStats(total: number, counts: Record<string, Record<string, number>>) {
  return {
    total,
    sums: [],
    counts: Object.entries(counts).map(([field, buckets]) => ({
      field,
      buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
    })),
  };
}

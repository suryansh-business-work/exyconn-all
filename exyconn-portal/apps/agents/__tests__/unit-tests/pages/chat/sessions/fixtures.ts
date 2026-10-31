import {
  WebsiteChatChannel,
  WebsiteChatSender,
  WebsiteChatSite,
  WebsiteChatStatus,
} from '@exyconn/shell/graphql/generated';
import type { ChatSessionRow } from '../../../../../src/pages/chat/sessions/chat-sessions-grid';
import type { ChatMessage } from '../../../../../src/pages/chat/socket/chatSocket.types';

/** One row of the chat list: an open website chat with Asha, assigned to nobody yet. */
export function sessionRow(overrides: Partial<ChatSessionRow> = {}): ChatSessionRow {
  return {
    __typename: 'WebsiteChatSession',
    id: 's1',
    name: 'Asha Rao',
    email: 'asha@example.test',
    phone: '+91 98450 00000',
    site: WebsiteChatSite.Website,
    pageUrl: 'https://exyconn.com/pricing',
    status: WebsiteChatStatus.Open,
    ticketId: '',
    ticketReference: 'TCK-42',
    assigneeId: '',
    assigneeName: '',
    lastMessageAt: '2026-10-07T09:30:00.000Z',
    lastMessagePreview: 'Do you build chatbots?',
    lastSender: 'VISITOR',
    staffUnread: 3,
    messageCount: 12,
    awaitingReplySince: null,
    handedOffAt: null,
    assignedAt: null,
    expiresAt: '2026-10-07T10:00:00.000Z',
    slackLinked: false,
    closedAt: null,
    closedBy: '',
    createdAt: '2026-10-07T09:00:00.000Z',
    updatedAt: '2026-10-07T09:30:00.000Z',
    ...overrides,
  };
}

/** One chat message as the socket sends it: by default a visitor writing in the live thread. */
export function chatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    __typename: 'WebsiteChatMessage',
    id: 'm1',
    sessionId: 's1',
    channel: WebsiteChatChannel.Live,
    sender: WebsiteChatSender.Visitor,
    senderName: 'Asha Rao',
    body: 'Hello there',
    suggestions: [],
    feedback: null,
    createdAt: '2026-10-07T09:31:00.000Z',
    readAt: null,
    attachments: [],
    sources: [],
    ...overrides,
  };
}

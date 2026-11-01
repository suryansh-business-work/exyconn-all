import { ChatSessionModel } from '../website-chat/models/chat-session.model';
import { WhatsappChatModel } from '../../../../../demos/whatsapp-demo/server/src/channel/chat.model';
import { maskedNumber } from '../../../../../demos/whatsapp-demo/server/src/channel/channel.analytics';
import { env } from '../../config/env';

/**
 * The live conversation behind a ticket, read from the channel that holds it. Each channel keeps
 * the link on its own side (ChatSession.ticketId, WhatsappChat.ticketId), so the desk works one
 * queue without a second copy of any conversation.
 */
export interface TicketSource {
  channel: string;
  contact: string;
  status: string;
  detail: string;
  messageCount: number;
  lastActivityAt: Date | null;
  url: string;
}

async function websiteChat(ticketId: string): Promise<TicketSource | null> {
  const session = await ChatSessionModel.findOne({ ticketId })
    .select('name email status lastMessagePreview messageCount lastMessageAt')
    .lean();
  if (!session) {
    return null;
  }
  return {
    channel: 'CHAT',
    contact: `${session.name} <${session.email}>`,
    status: session.status,
    detail: session.lastMessagePreview,
    messageCount: session.messageCount,
    lastActivityAt: session.lastMessageAt ?? null,
    url: `${env.websiteChatConsoleUrl}/${String(session._id)}`,
  };
}

async function whatsappChat(ticketId: string): Promise<TicketSource | null> {
  const chat = await WhatsappChatModel.findOne({ ticketId })
    .select('waId name demoKey lastEventAt')
    .lean();
  if (!chat) {
    return null;
  }
  const number = maskedNumber(chat.waId);
  return {
    channel: 'WHATSAPP',
    contact: chat.name ? `${chat.name} (${number})` : number,
    status: 'ACTIVE',
    detail: chat.demoKey ?? '',
    messageCount: 0,
    lastActivityAt: chat.lastEventAt ?? null,
    url: '',
  };
}

/** The conversation a ticket links to; null for a channel whose thread is the ticket itself. */
export function ticketSource(ticket: { _id: unknown; channel?: string | null }) {
  const id = String(ticket._id);
  if (ticket.channel === 'CHAT') {
    return websiteChat(id);
  }
  if (ticket.channel === 'WHATSAPP') {
    return whatsappChat(id);
  }
  return Promise.resolve(null);
}

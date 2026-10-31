import { WhatsappChatModel } from './chat.model';
import { maskedNumber } from './channel.analytics';
import type { ChatRecord } from './channel.chats';
import { fileClientTicket } from '../../../../../exyconn-portal/server/src/modules/support/client-ticket.service';
import {
  SUPPORT_CLOSED_STATUSES,
  SupportTicketModel,
} from '../../../../../exyconn-portal/server/src/modules/employee/support.model';

/**
 * Files a WhatsApp conversation in the support desk's queue, beside website chats and the
 * support mailbox. The ticket links to the chat (WhatsappChat.ticketId) instead of copying it:
 * nothing the person typed is stored, and the desk reads the chat's live state from the link.
 * A chat whose ticket has been resolved files a new one on its next message.
 */
export async function ensureChatTicket(chat: ChatRecord): Promise<void> {
  const current = await WhatsappChatModel.findById(chat.id).select('ticketId').lean();
  if (current?.ticketId) {
    const ticket = await SupportTicketModel.findById(current.ticketId).select('status').lean();
    if (ticket && !SUPPORT_CLOSED_STATUSES.has(ticket.status)) {
      return;
    }
  }
  const number = maskedNumber(chat.waId);
  const who = chat.name || number;
  const ticket = await fileClientTicket(
    {
      requesterName: who,
      requesterEmail: '',
      subject: `WhatsApp chat with ${who}`,
      category: 'OTHER',
      description: [
        `${who} (${number}) wrote to the WhatsApp number.`,
        'The conversation stays in WhatsApp; open the ticket to see where the chat stands.',
      ].join('\n'),
      priority: 'MEDIUM',
    },
    'WHATSAPP',
  );
  await WhatsappChatModel.updateOne(
    { _id: chat.id },
    { $set: { ticketId: ticket._id.toHexString() } },
  );
}

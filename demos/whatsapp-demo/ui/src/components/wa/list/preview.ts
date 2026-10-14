import type { ChatMessage } from '@exyconn/wa-flow';

type Translate = (source: string, values?: Record<string, string | number>) => string;

/** What the chat list shows for a chat's last message. */
export function previewOf(message: ChatMessage | undefined, t: Translate): string {
  if (!message) {
    return '';
  }
  const content = message.content;
  switch (content.type) {
    case 'text':
    case 'buttons':
    case 'list':
    case 'cta':
    case 'reply':
    case 'system':
      return content.text;
    case 'image':
      return content.caption ?? t('Photo');
    case 'document':
      return content.document.fileName;
    case 'location':
      return t('Location: {name}', { name: content.location.name });
    case 'contact':
      return t('Contact: {name}', { name: content.contact.name });
    case 'product':
      return content.product.title;
    case 'carousel':
      return content.text ?? t('Catalogue');
    case 'ticket':
      return t('Ticket {id}', { id: content.ticket.ticketId });
    default:
      return content.order.title;
  }
}

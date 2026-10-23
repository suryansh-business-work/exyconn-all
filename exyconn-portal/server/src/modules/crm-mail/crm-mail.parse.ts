import { decodeHtmlEntities } from '../../utils/htmlEntities';
import { htmlToText } from '../../utils/inboundMail';
import { sanitizeRichHtml } from '../../utils/sanitizeHtml';
import type { GmailMessage } from '../gmail/gmail.client';
import { firstPartOf, headerOf, type GmailPart } from '../gmail/gmail.mime';

/** Reading Gmail's messages into what CRM > Mail lists and shows. */

/** The longest body kept for one message; anything past it is cut. */
const MAX_BODY = 200_000;

export interface MailAddress {
  name: string;
  address: string;
}

/** Splits an address header on the commas between addresses, not those inside a quoted name. */
function splitAddresses(header: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of header) {
    if (char === '"') {
      quoted = !quoted;
    }
    if (char === ',' && !quoted) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

/** `"Doe, Asha" <asha@acme.io>, b@x.com` → each address with its display name ('' if none). */
export function parseAddresses(header: string): MailAddress[] {
  return splitAddresses(header)
    .map((part) => {
      const open = part.lastIndexOf('<');
      const close = part.indexOf('>', open);
      if (open >= 0 && close > open) {
        const name = part.slice(0, open).trim().replaceAll('"', '');
        return {
          name,
          address: part
            .slice(open + 1, close)
            .trim()
            .toLowerCase(),
        };
      }
      return { name: '', address: part.trim().toLowerCase() };
    })
    .filter((entry) => entry.address.includes('@'));
}

const addressesOf = (message: GmailMessage, name: string) =>
  parseAddresses(headerOf(message.payload, name));

/** The conversation's row in the list, from its messages (Gmail's metadata or full format). */
export function threadSummary(messages: GmailMessage[], mailbox: { id: string; email: string }) {
  const last = messages.at(-1);
  const labels = new Set(messages.flatMap((message) => message.labelIds ?? []));
  const participants = new Set<string>();
  for (const message of messages) {
    for (const field of ['From', 'To', 'Cc']) {
      for (const entry of addressesOf(message, field)) {
        participants.add(entry.address);
      }
    }
  }
  const sender = last ? addressesOf(last, 'From')[0] : undefined;
  return {
    accountId: mailbox.id,
    mailbox: mailbox.email,
    subject: messages[0] ? headerOf(messages[0].payload, 'Subject') : '',
    snippet: decodeHtmlEntities(last?.snippet ?? ''),
    fromName: sender?.name ?? '',
    fromAddress: sender?.address ?? '',
    participants: [...participants],
    labelIds: [...labels],
    unread: labels.has('UNREAD'),
    starred: labels.has('STARRED'),
    messageCount: messages.length,
    hasAttachments: messages.some((message) => message.payload?.mimeType === 'multipart/mixed'),
    messageIds: messages.map((message) => headerOf(message.payload, 'Message-ID')).filter(Boolean),
    lastAt: new Date(Number(last?.internalDate ?? 0)),
  };
}

export type ThreadSummary = ReturnType<typeof threadSummary>;

/** Every attached file of a message: what the reader lists and downloads one by one. */
function attachmentsOf(part: GmailPart | undefined, messageId: string): MailAttachment[] {
  if (!part) {
    return [];
  }
  const own =
    part.filename && part.body?.attachmentId
      ? [
          {
            id: part.body.attachmentId,
            messageId,
            filename: part.filename,
            mimeType: part.mimeType ?? 'application/octet-stream',
            size: part.body.size ?? 0,
          },
        ]
      : [];
  return [...own, ...(part.parts ?? []).flatMap((child) => attachmentsOf(child, messageId))];
}

export interface MailAttachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * One message as the reader shows it. Its HTML is cleaned by the portal's sanitizer (no
 * script, handler, frame or unsafe link survives) before it leaves the server.
 */
export function messageDetail(message: GmailMessage, mailboxEmail: string) {
  const html = firstPartOf(message.payload, 'text/html').slice(0, MAX_BODY);
  const plain = firstPartOf(message.payload, 'text/plain').slice(0, MAX_BODY);
  const sender = addressesOf(message, 'From')[0] ?? { name: '', address: '' };
  const list = (name: string) => addressesOf(message, name).map((entry) => entry.address);
  return {
    id: message.id,
    messageId: headerOf(message.payload, 'Message-ID'),
    fromName: sender.name,
    fromAddress: sender.address,
    to: list('To'),
    cc: list('Cc'),
    bcc: list('Bcc'),
    subject: headerOf(message.payload, 'Subject'),
    sentAt: new Date(Number(message.internalDate ?? 0)),
    direction: sender.address === mailboxEmail ? 'OUT' : 'IN',
    html: html ? sanitizeRichHtml(html) : '',
    text: plain || htmlToText(html),
    snippet: decodeHtmlEntities(message.snippet ?? ''),
    unread: (message.labelIds ?? []).includes('UNREAD'),
    attachments: attachmentsOf(message.payload, message.id),
  };
}

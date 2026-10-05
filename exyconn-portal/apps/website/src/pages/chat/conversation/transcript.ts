import type { GridTranslate } from '@exyconn/shell/components/data/gridContext';
import { WebsiteChatChannel } from '@exyconn/shell/graphql/generated';
import type { ChatMessage, ChatSession } from '../socket/chatSocket.types';
import { SITE_LABEL } from '../sessions/chat-sessions-grid';

type FormatDateTime = (value: string) => string;

/** The two threads in the order a reader expects them, with the names the console shows. */
export const THREAD_TITLES: ReadonlyArray<{ channel: WebsiteChatChannel; title: string }> = [
  { channel: WebsiteChatChannel.Live, title: 'Chat with us' },
  { channel: WebsiteChatChannel.Knowledge, title: 'Knowledge Bot' },
];

function messageLines(message: ChatMessage, formatDateTime: FormatDateTime): string[] {
  const head = `[${formatDateTime(message.createdAt)}] ${message.senderName}:`;
  const lines = [message.body ? `${head} ${message.body}` : head];
  for (const attachment of message.attachments) {
    lines.push(`    ${attachment.name} — ${attachment.url}`);
  }
  return lines;
}

/**
 * The whole conversation as plain text — the visitor's details, then both threads — with
 * every time written in the viewer's configured format and timezone.
 */
export function transcriptText(
  session: ChatSession,
  messages: readonly ChatMessage[],
  formatDateTime: FormatDateTime,
  t: GridTranslate,
): string {
  const details: Array<[string, string]> = [
    [t('Visitor'), session.name],
    [t('Email'), session.email],
    [t('Phone'), session.phone],
    [t('Site'), t(SITE_LABEL[session.site])],
    [t('Page'), session.pageUrl],
    [t('Ticket'), session.ticketReference],
    [t('Assignee'), session.assigneeName],
    [t('Started'), formatDateTime(session.createdAt)],
  ];
  const lines = details.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`);
  for (const { channel, title } of THREAD_TITLES) {
    const thread = messages.filter((message) => message.channel === channel);
    lines.push('', `=== ${t(title)} ===`);
    if (thread.length === 0) {
      lines.push(t('No messages'));
    }
    for (const message of thread) {
      lines.push(...messageLines(message, formatDateTime));
    }
  }
  return `${lines.join('\n')}\n`;
}

/** Saves `text` as a .txt file in the browser. */
export function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

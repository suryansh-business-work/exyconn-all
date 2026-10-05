import { formatInTimeZone } from 'date-fns-tz';
import { emailer } from '../email/email.service';
import { logger } from '../../utils/logger';
import { listMessages } from './chat.messages';
import { readChatSettings } from './chat.settings';

interface TranscriptSession {
  _id: unknown;
  name: string;
  email: string;
  ticketReference: string;
}

const SENDER_LABEL: Readonly<Record<string, string>> = {
  VISITOR: 'You',
  AGENT: 'Exyconn',
  BOT: 'Knowledge Bot',
  SYSTEM: 'Chat',
};
const THREAD_LABEL: Readonly<Record<string, string>> = {
  LIVE: 'Chat with us',
  KNOWLEDGE: 'Knowledge Bot',
};

/** The conversation as plain text, each thread in turn, stamped in the chat's timezone. */
export async function transcriptText(session: TranscriptSession): Promise<string> {
  const [messages, settings] = await Promise.all([
    listMessages(String(session._id)),
    readChatSettings(),
  ]);
  const sections = ['LIVE', 'KNOWLEDGE'].map((channel) => {
    const lines = messages
      .filter((message) => message.channel === channel)
      .map((message) => {
        const at = formatInTimeZone(message.createdAt, settings.timezone, 'yyyy-MM-dd HH:mm');
        const who = message.senderName || SENDER_LABEL[message.sender];
        const files = message.attachments.map((file) => `  [${file.kind}] ${file.url}`);
        return [`[${at}] ${who}: ${message.body}`, ...files].join('\n');
      });
    return lines.length > 0 ? `== ${THREAD_LABEL[channel]} ==\n${lines.join('\n')}` : '';
  });
  const header = `Chat ${session.ticketReference} with ${session.name} <${session.email}>`;
  return [header, ...sections.filter(Boolean)].join('\n\n');
}

/** Emails the visitor the whole conversation as a text attachment. Failures are logged only. */
export async function emailTranscript(session: TranscriptSession): Promise<void> {
  try {
    const text = await transcriptText(session);
    await emailer.send({
      template: 'website-chat-transcript',
      to: session.email,
      variables: { name: session.name, reference: session.ticketReference },
      attachments: [
        { filename: `chat-${session.ticketReference}.txt`, content: Buffer.from(text, 'utf8') },
      ],
      triggeredBy: 'Website chat closed',
    });
  } catch (error) {
    logger.error({ err: error }, 'Website chat transcript email failed');
  }
}

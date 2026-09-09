import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { logger } from './logger';

/** What the mailbox reader needs off the active Inbound Mail config. */
export interface InboundMailCredentials {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  mailbox: string;
  deleteAfterImport: boolean;
}

/** A file that came in on a message, still in memory. */
export interface InboundAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

/**
 * One arrived message, reduced to the fields the support desk actually decides on.
 *
 * The wire format stops here: everything downstream works on this shape, which is why
 * the import rules can be unit-tested without an IMAP server or a MIME fixture.
 */
export interface InboundMessage {
  /** Lower-cased sender address, or '' when the message carries none. */
  from: string;
  fromName: string;
  subject: string;
  /** The plain-text body, quoting included — stripping it is the module's business. */
  body: string;
  inReplyTo: string;
  references: string;
  /** The `Auto-Submitted` header, lower-cased. Empty when the message carries none. */
  autoSubmitted: string;
  /** Whether the message carries an `X-Autoreply` header. */
  autoReply: boolean;
  attachments: InboundAttachment[];
}

export interface InboundRunResult {
  imported: number;
  failed: number;
}

/** A message read off the wire, before anything has been done with it. */
interface RawMessage {
  uid: number;
  source: Buffer;
}

/** Everything but the text, so a signature logo does not become a ticket attachment. */
const INLINE = 'inline';

function headerText(mail: ParsedMail, name: string): string {
  const value = mail.headers.get(name);
  return typeof value === 'string' ? value : '';
}

/** `<p>Hi</p>` → `Hi`, for the clients that send no plain-text part at all. */
function htmlToText(html: string): string {
  return html
    .replaceAll(/<(script|style)[^]*?<\/\1>/gi, ' ')
    .replaceAll(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>/gi, '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();
}

function bodyOf(mail: ParsedMail): string {
  return mail.text ?? htmlToText(mail.html || '');
}

function attachmentsOf(mail: ParsedMail): InboundAttachment[] {
  return mail.attachments
    .filter((file) => file.contentDisposition !== INLINE)
    .map((file, index) => ({
      filename: file.filename ?? `attachment-${index + 1}`,
      contentType: file.contentType ?? '',
      content: file.content,
    }));
}

/** Everything the desk decides on, lifted out of the parsed MIME tree. */
export function toInboundMessage(mail: ParsedMail): InboundMessage {
  const sender = mail.from?.value[0];
  const references = mail.references ?? '';
  return {
    from: (sender?.address ?? '').toLowerCase(),
    fromName: sender?.name ?? '',
    subject: mail.subject ?? '',
    body: bodyOf(mail),
    inReplyTo: mail.inReplyTo ?? '',
    references: Array.isArray(references) ? references.join(' ') : references,
    autoSubmitted: headerText(mail, 'auto-submitted').toLowerCase(),
    autoReply: mail.headers.has('x-autoreply'),
    attachments: attachmentsOf(mail),
  };
}

/**
 * IMAP reader for the support mailbox (singleton). The credentials come from the active
 * Inbound Mail config in the Tech module, the same way the outgoing mailer's do.
 */
class InboundMailbox {
  private client(config: InboundMailCredentials): ImapFlow {
    return new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
      logger: false,
    });
  }

  /** Signs in and opens the mailbox, so credentials can be checked before they are relied on. */
  async verify(config: InboundMailCredentials): Promise<void> {
    const client = this.client(config);
    await client.connect();
    try {
      const lock = await client.getMailboxLock(config.mailbox);
      lock.release();
    } finally {
      await client.logout();
    }
  }

  /**
   * Hands every unseen message to `handle`, then marks the ones it accepted as seen — and
   * deletes them when the config says to.
   *
   * A message `handle` throws on is left unseen on purpose: the next round tries it again,
   * so a ticket is never lost to a transient failure, and a message that keeps failing
   * stays visible in the mailbox where a human can see it.
   */
  async importAll(
    config: InboundMailCredentials,
    handle: (message: InboundMessage) => Promise<void>,
  ): Promise<InboundRunResult> {
    const client = this.client(config);
    await client.connect();
    try {
      const lock = await client.getMailboxLock(config.mailbox);
      try {
        return await this.drain(client, config, handle);
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  private async drain(
    client: ImapFlow,
    config: InboundMailCredentials,
    handle: (message: InboundMessage) => Promise<void>,
  ): Promise<InboundRunResult> {
    const result: InboundRunResult = { imported: 0, failed: 0 };
    for (const raw of await readUnseen(client)) {
      const ok = await this.importOne(client, config, raw, handle);
      if (ok) {
        result.imported += 1;
      } else {
        result.failed += 1;
      }
    }
    return result;
  }

  private async importOne(
    client: ImapFlow,
    config: InboundMailCredentials,
    raw: RawMessage,
    handle: (message: InboundMessage) => Promise<void>,
  ): Promise<boolean> {
    try {
      await handle(toInboundMessage(await simpleParser(raw.source)));
    } catch (error) {
      logger.error({ err: error }, `Inbound mail: message ${raw.uid} could not be imported`);
      return false;
    }
    await settle(client, config, raw.uid);
    return true;
  }
}

/**
 * Every unseen message, read into memory before any of it is processed: no other IMAP
 * command may run while a fetch is still streaming, and marking a message seen is one.
 */
async function readUnseen(client: ImapFlow): Promise<RawMessage[]> {
  const messages: RawMessage[] = [];
  for await (const message of client.fetch({ seen: false }, { uid: true, source: true })) {
    // A message the server declined to hand over cannot be parsed; leaving it unseen
    // means the next round asks for it again.
    if (message.source) {
      messages.push({ uid: message.uid, source: message.source });
    }
  }
  return messages;
}

/** Marks an imported message seen, and removes it only when the config asks for that. */
async function settle(
  client: ImapFlow,
  config: InboundMailCredentials,
  uid: number,
): Promise<void> {
  const range = String(uid);
  await client.messageFlagsAdd(range, ['\\Seen'], { uid: true });
  if (config.deleteAfterImport) {
    await client.messageDelete(range, { uid: true });
  }
}

export const inboundMailbox = new InboundMailbox();

import { SupportTicketModel } from '../employee/support.model';
import { InboundMailConfigModel } from '../tech/inbound-mail-config.model';
import { UserModel } from '../admin/user.model';
import { SupportReplyModel } from './support-reply.model';
import { fileClientTicket } from './client-ticket.service';
import { stripQuotedReply } from './inbound-mail.text';
import { toAttachments, type Attachment, type AttachmentInput } from './attachment.schema';
import { imageUploader } from '../../utils/imagekit';
import {
  inboundMailbox,
  type InboundAttachment,
  type InboundMessage,
} from '../../utils/inboundMail';
import { JOB_KEYS, recordJobRun } from '../../utils/jobHeartbeat';
import { logger } from '../../utils/logger';

/** What became of one arrived message. */
export type InboundOutcome = 'CREATED' | 'REPLIED' | 'IGNORED';

/** A quotable ticket handle, wherever in the subject or the threading headers it sits. */
const REFERENCE_PATTERN = /EXY-[A-Z2-9]{6}/;

/** Local parts no human writes from: a bounce or an out-of-office, never a request. */
const ROBOT_SENDERS: ReadonlySet<string> = new Set(['mailer-daemon', 'postmaster']);

/** Stands in for the account an emailed reply has no way of having. */
const INBOUND_AUTHOR_ID = 'inbound-mail';

/** Both `body` and `description` are required, and a mail can carry only a file. */
const EMPTY_BODY = '(no message body)';

/** Where an emailed ticket lands until an agent triages it. */
const DEFAULT_CATEGORY = 'OTHER';
const DEFAULT_PRIORITY = 'MEDIUM';

/** How often the mailbox is read when no config says otherwise. */
const DEFAULT_POLL_SECONDS = 120;
const SECOND_MS = 1000;

/** The ticket reference the message quotes, or '' when it quotes none. */
export function findReference(message: InboundMessage): string {
  const quoted = `${message.subject} ${message.inReplyTo} ${message.references}`.toUpperCase();
  return REFERENCE_PATTERN.exec(quoted)?.[0] ?? '';
}

/**
 * Whether the message is a machine talking. An auto-reply answered as a ticket starts a
 * conversation with a robot, and a bounce filed as a request buries the desk in noise —
 * so both are dropped, along with anything that arrived without a sender to answer.
 */
export function isAutomated(message: InboundMessage): boolean {
  if (!message.from || message.autoReply || message.autoSubmitted.startsWith('auto-')) {
    return true;
  }
  return ROBOT_SENDERS.has(message.from.split('@')[0] ?? '');
}

/** The employee's own address, so their emailed reply is recognised on their ticket. */
async function employeeAddress(employeeId: string): Promise<string> {
  if (!employeeId) {
    return '';
  }
  const employee = await UserModel.findById(employeeId).select('email').lean();
  return (employee?.email ?? '').toLowerCase();
}

/**
 * The ticket this message belongs on, or null.
 *
 * A reference is a handle, not a credential — it travels in every subject line on the
 * thread — so it is only honoured when the sender is the person the ticket is about.
 * Anybody else quoting it gets a ticket of their own rather than a voice on somebody's.
 */
async function matchingTicket(reference: string, sender: string) {
  const ticket = await SupportTicketModel.findOne({ reference }).lean();
  if (!ticket) {
    return null;
  }
  const requester = ticket.requesterEmail || (await employeeAddress(ticket.employeeId));
  if (requester && requester === sender) {
    return ticket;
  }
  logger.warn(`Inbound mail: ${sender} quoted ${reference} but is not its requester`);
  return null;
}

/** Puts each file on the image CDN, the same store the console's own uploads go to. */
async function hostAttachments(files: InboundAttachment[], uploadedBy: string) {
  const hosted: AttachmentInput[] = [];
  for (const file of files) {
    const url = await imageUploader.uploadImage(
      file.content.toString('base64'),
      file.filename,
      'support',
    );
    hosted.push({ url, name: file.filename, contentType: file.contentType });
  }
  return toAttachments(hosted, uploadedBy);
}

/**
 * Adds the mail to the thread as a public reply.
 *
 * `firstRespondedAt` is deliberately left alone: it measures the desk answering, and this
 * is the person who raised the ticket writing back — stamping it here would let a ticket
 * meet a promise nobody on the team has kept yet.
 */
async function appendReply(
  ticketId: string,
  message: InboundMessage,
  body: string,
  attachments: Attachment[],
): Promise<void> {
  await SupportReplyModel.create({
    ticketId,
    authorId: INBOUND_AUTHOR_ID,
    authorName: message.fromName || message.from,
    body: body || EMPTY_BODY,
    internal: false,
    attachments,
  });
}

/** Files the mail as a new customer ticket, down the same path the public form uses. */
async function openTicket(
  message: InboundMessage,
  body: string,
  attachments: Attachment[],
): Promise<void> {
  const subject = message.subject || 'Support request by email';
  await fileClientTicket(
    {
      requesterName: message.fromName || message.from,
      requesterEmail: message.from,
      subject,
      category: DEFAULT_CATEGORY,
      description: body || subject,
      priority: DEFAULT_PRIORITY,
    },
    'EMAIL',
    attachments,
  );
}

/**
 * Turns one arrived message into desk work: a reply on the ticket it quotes, or a new
 * customer ticket.
 *
 * Exported and free of the mailbox itself, so the rules that decide a customer's fate
 * are tested against plain objects rather than against a live IMAP server.
 */
export async function importInboundMessage(message: InboundMessage): Promise<InboundOutcome> {
  if (isAutomated(message)) {
    logger.info(`Inbound mail from "${message.from}" ignored: automated`);
    return 'IGNORED';
  }
  const body = stripQuotedReply(message.body);
  const reference = findReference(message);
  const ticket = reference ? await matchingTicket(reference, message.from) : null;
  const attachments = await hostAttachments(message.attachments, message.fromName || message.from);
  if (ticket) {
    await appendReply(String(ticket._id), message, body, attachments);
    return 'REPLIED';
  }
  await openTicket(message, body, attachments);
  return 'CREATED';
}

async function handleMessage(message: InboundMessage): Promise<void> {
  const outcome = await importInboundMessage(message);
  logger.info(`Inbound mail from "${message.from}": ${outcome}`);
}

/** Reads the mailbox once and reports how long to wait before reading it again. */
async function pollOnce(): Promise<number> {
  const config = await InboundMailConfigModel.findOne({ isActive: true }).lean();
  if (!config) {
    recordJobRun(JOB_KEYS.inboundMail, 'No mailbox configured');
    return DEFAULT_POLL_SECONDS;
  }
  const result = await inboundMailbox.importAll(config, handleMessage);
  recordJobRun(JOB_KEYS.inboundMail, `Imported ${result.imported}, failed ${result.failed}`);
  return config.pollSeconds;
}

/** Waits, then runs the next round — at whatever interval the config now asks for. */
function scheduleNext(seconds: number): void {
  globalThis
    .setTimeout(() => {
      runRound().catch((error: unknown) => logger.error(error, 'Inbound mail round failed'));
    }, seconds * SECOND_MS)
    .unref();
}

async function runRound(): Promise<void> {
  const seconds = await pollOnce().catch((error: unknown) => {
    logger.error(error, 'Inbound mail poll failed');
    return DEFAULT_POLL_SECONDS;
  });
  scheduleNext(seconds);
}

/**
 * Starts the loop that turns the support mailbox into tickets. With no active config it
 * stands down each round rather than exiting, so configuring a mailbox in Tech starts
 * the import without a restart.
 */
export function startInboundMail(): void {
  scheduleNext(0);
  logger.info('Inbound support mail poller started');
}
